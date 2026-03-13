import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';
import { generateSaleNumber } from '@/lib/utils';

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const {
      orderId,
      paymentMethod,
      cashTendered = 0,
      changeAmount = 0,
      splitPayments = [],
      customerId,
      tax = 0,
      discount = 0,
      subtotal,
      total,
    } = req.body;

    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    const tableOrder = await prisma.tableOrder.findUnique({
      where: { id: parseInt(orderId) },
      include: { table: true },
    });
    if (!tableOrder) return res.status(404).json({ error: 'Order not found' });

    const items = JSON.parse(tableOrder.itemsJson || '[]');
    if (items.length === 0) return res.status(400).json({ error: 'Order has no items' });

    const saleNumber = generateSaleNumber();
    const paymentStatus = paymentMethod === 'credit' ? 'credit' : 'paid';

    const sale = await prisma.$transaction(async (tx) => {
      // Create sale
      const newSale = await tx.sale.create({
        data: {
          saleNumber,
          customerId: customerId ? parseInt(customerId) : null,
          userId: req.user.id,
          tableId: tableOrder.tableId,
          subtotal: parseFloat(subtotal),
          discount: parseFloat(discount),
          tax: parseFloat(tax),
          total: parseFloat(total),
          paymentMethod,
          paymentStatus,
          status: 'completed',
          cashTendered: parseFloat(cashTendered),
          changeAmount: parseFloat(changeAmount),
          orderType: 'dine_in',
          notes: tableOrder.notes || null,
          items: {
            create: items.map((item) => ({
              productId: parseInt(item.id),
              productName: item.name,
              variation: item.variation || null,
              quantity: parseInt(item.quantity),
              price: parseFloat(item.price),
              discount: parseFloat(item.discount || 0),
              total: parseFloat(item.total),
            })),
          },
          splitPayments: splitPayments.length
            ? {
                create: splitPayments.map((sp) => ({
                  method: sp.method,
                  amount: parseFloat(sp.amount),
                })),
              }
            : undefined,
        },
        include: {
          items: true,
          customer: true,
          user: { select: { id: true, name: true } },
          splitPayments: true,
        },
      });

      // Decrement stock for tracked products
      await Promise.all(
        items.map(async (item) => {
          const prod = await tx.product.findUnique({
            where: { id: parseInt(item.id) },
            select: { trackQuantity: true },
          });
          if (prod?.trackQuantity !== false) {
            return tx.product.update({
              where: { id: parseInt(item.id) },
              data: { stock: { decrement: parseInt(item.quantity) } },
            });
          }
        })
      );

      // Credit ledger if credit sale
      if (paymentMethod === 'credit' && customerId) {
        const customer = await tx.customer.findUnique({ where: { id: parseInt(customerId) } });
        const newBalance = parseFloat(customer.creditBalance) + parseFloat(total);
        await tx.customer.update({
          where: { id: parseInt(customerId) },
          data: { creditBalance: newBalance },
        });
        await tx.customerLedger.create({
          data: {
            customerId: parseInt(customerId),
            type: 'debit',
            amount: parseFloat(total),
            balance: newBalance,
            referenceId: newSale.id,
            referenceType: 'sale',
            notes: `Credit sale – ${saleNumber}`,
          },
        });
      }

      // Mark order as paid and free the table
      await tx.tableOrder.update({
        where: { id: parseInt(orderId) },
        data: { status: 'paid' },
      });
      await tx.table.update({
        where: { id: tableOrder.tableId },
        data: { status: 'free' },
      });

      return newSale;
    }, { timeout: 15000, maxWait: 5000 });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_SALE',
        description: `Table order checkout – Sale ${saleNumber} – Total: ${total}`,
      },
    });

    return res.status(201).json({ sale });
  } catch (err) {
    console.error('Table checkout error:', err);
    return res.status(500).json({ error: 'Failed to process payment' });
  }
}

export default withAuth(handler);
