import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!['admin', 'manager'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });

  const id = parseInt(req.query.id);
  try {
    const sale = await prisma.sale.findUnique({ where: { id }, include: { items: true } });
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    if (sale.status === 'refunded') return res.status(400).json({ error: 'Already refunded' });

    await prisma.$transaction(async (tx) => {
      await tx.sale.update({ where: { id }, data: { status: 'refunded' } });

      // Restore stock
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      // Reverse credit ledger if credit sale
      if (sale.paymentMethod === 'credit' && sale.customerId) {
        const customer = await tx.customer.findUnique({ where: { id: sale.customerId } });
        const newBalance = Math.max(0, parseFloat(customer.creditBalance) - parseFloat(sale.total));
        await tx.customer.update({ where: { id: sale.customerId }, data: { creditBalance: newBalance } });
        await tx.customerLedger.create({
          data: {
            customerId: sale.customerId,
            type: 'credit',
            amount: parseFloat(sale.total),
            balance: newBalance,
            referenceId: id,
            referenceType: 'sale',
            notes: `Refund – ${sale.saleNumber}`,
          },
        });
      }
    });

    await prisma.activityLog.create({
      data: { userId: req.user.id, action: 'REFUND_SALE', description: `Refunded sale ${sale.saleNumber}` },
    });

    return res.status(200).json({ message: 'Refund processed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to process refund' });
  }
}

export default withAuth(handler);
