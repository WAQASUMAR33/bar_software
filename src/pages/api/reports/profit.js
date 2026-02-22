import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';
import { startOfDay, endOfDay } from 'date-fns';

async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  if (!['admin', 'manager'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });

  const { startDate, endDate } = req.query;
  const start = startDate ? startOfDay(new Date(startDate)) : startOfDay(new Date());
  const end = endDate ? endOfDay(new Date(endDate)) : endOfDay(new Date());

  try {
    // Revenue
    const revenue = await prisma.sale.aggregate({
      where: { createdAt: { gte: start, lte: end }, status: 'completed' },
      _sum: { total: true },
    });

    // Cost of goods sold
    const saleItems = await prisma.saleItem.findMany({
      where: { sale: { createdAt: { gte: start, lte: end }, status: 'completed' } },
      include: { product: { select: { costPrice: true } } },
    });

    const cogs = saleItems.reduce(
      (sum, item) => sum + parseFloat(item.product.costPrice) * item.quantity,
      0
    );

    // Expenses
    const expenses = await prisma.expense.aggregate({
      where: { expenseDate: { gte: start, lte: end } },
      _sum: { amount: true },
    });

    const totalRevenue = parseFloat(revenue._sum.total || 0);
    const totalExpenses = parseFloat(expenses._sum.amount || 0);
    const grossProfit = totalRevenue - cogs;
    const netProfit = grossProfit - totalExpenses;

    return res.status(200).json({
      revenue: totalRevenue,
      cogs: parseFloat(cogs.toFixed(2)),
      grossProfit: parseFloat(grossProfit.toFixed(2)),
      expenses: totalExpenses,
      netProfit: parseFloat(netProfit.toFixed(2)),
      grossMargin: totalRevenue > 0 ? parseFloat(((grossProfit / totalRevenue) * 100).toFixed(2)) : 0,
      netMargin: totalRevenue > 0 ? parseFloat(((netProfit / totalRevenue) * 100).toFixed(2)) : 0,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to generate profit report' });
  }
}

export default withAuth(handler);
