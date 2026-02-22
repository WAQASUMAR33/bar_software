import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';

async function handler(req, res) {
  if (req.method === 'GET') {
    const { customerId } = req.query;
    const where = customerId ? { customerId: parseInt(customerId) } : {};
    const payments = await prisma.customerPayment.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Also get all customers with outstanding balance
    const creditCustomers = await prisma.customer.findMany({
      where: { active: true, creditBalance: { gt: 0 } },
      orderBy: { creditBalance: 'desc' },
    });

    return res.status(200).json({ payments, creditCustomers });
  }

  if (req.method === 'POST') {
    const { customerId, amount, paymentMethod, notes } = req.body;
    if (!customerId || !amount) return res.status(400).json({ error: 'Customer and amount required' });

    try {
      const result = await prisma.$transaction(async (tx) => {
        const customer = await tx.customer.findUnique({ where: { id: parseInt(customerId) } });
        if (!customer) throw new Error('Customer not found');

        const payAmt = parseFloat(amount);
        const newBalance = Math.max(0, parseFloat(customer.creditBalance) - payAmt);

        // Update customer balance
        await tx.customer.update({
          where: { id: parseInt(customerId) },
          data: { creditBalance: newBalance },
        });

        // Create payment record
        const payment = await tx.customerPayment.create({
          data: {
            customerId: parseInt(customerId),
            userId: req.user.id,
            amount: payAmt,
            paymentMethod: paymentMethod || 'cash',
            notes: notes || null,
          },
        });

        // Ledger entry
        await tx.customerLedger.create({
          data: {
            customerId: parseInt(customerId),
            type: 'credit',
            amount: payAmt,
            balance: newBalance,
            referenceId: payment.id,
            referenceType: 'payment',
            notes: notes || 'Payment received',
          },
        });

        return payment;
      });

      return res.status(201).json({ payment: result });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message || 'Failed to process payment' });
    }
  }

  return res.status(405).end();
}

export default withAuth(handler);
