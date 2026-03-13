import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';
import { generateSaleNumber } from '@/lib/utils';

async function handler(req, res) {
  // GET – list sales
  if (req.method === 'GET') {
    try {
      const { page = 1, limit = 20, status, startDate, endDate } = req.query;
      const where = {};
      if (status) where.status = status;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59');
      }

      const [sales, total] = await Promise.all([
        prisma.sale.findMany({
          where,
          include: {
            customer: { select: { id: true, name: true } },
            user: { select: { id: true, name: true } },
            items: true,
          },
          orderBy: { createdAt: 'desc' },
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit),
        }),
        prisma.sale.count({ where }),
      ]);

      return res.status(200).json({ sales, total });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch sales' });
    }
  }

  // POST – create sale
  if (req.method === 'POST') {
    try {
      const {
        items,
        customerId,
        discount = 0,
        tax = 0,
        subtotal,
        total,
        paymentMethod,
        cashTendered = 0,
        changeAmount = 0,
        splitPayments = [],
        notes,
        orderType,
        tableId,
      } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'No items in sale' });
      }

      const saleNumber = generateSaleNumber();
      const paymentStatus = paymentMethod === 'credit' ? 'credit' : 'paid';

      const sale = await prisma.$transaction(async (tx) => {
        // Create sale
        const newSale = await tx.sale.create({
          data: {
            saleNumber,
            customerId: customerId ? parseInt(customerId) : null,
            userId: req.user.id,
            subtotal: parseFloat(subtotal),
            discount: parseFloat(discount),
            tax: parseFloat(tax),
            total: parseFloat(total),
            paymentMethod,
            paymentStatus,
            status: 'completed',
            cashTendered: parseFloat(cashTendered),
            changeAmount: parseFloat(changeAmount),
            orderType: orderType || null,
            tableId: tableId ? parseInt(tableId) : null,
            notes: notes || null,
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
              ? { create: splitPayments.map((sp) => ({ method: sp.method, amount: parseFloat(sp.amount) })) }
              : undefined,
          },
          include: {
            items: true,
            customer: true,
            user: { select: { id: true, name: true } },
            splitPayments: true,
          },
        });

        // Decrement stock only for products that track quantity
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

        // Credit customer ledger if credit sale
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

        return newSale;
      }, { timeout: 15000, maxWait: 5000 });

      await prisma.activityLog.create({
        data: { userId: req.user.id, action: 'CREATE_SALE', description: `Sale ${saleNumber} – Total: ${total}` },
      });

      return res.status(201).json({ sale });
    } catch (err) {
      console.error('Create sale error:', err);
      return res.status(500).json({ error: 'Failed to create sale' });
    }
  }

  return res.status(405).end();
}

export default withAuth(handler);
