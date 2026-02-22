import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Today's sales
    const todaySales = await prisma.sale.aggregate({
      where: { createdAt: { gte: todayStart, lte: todayEnd }, status: 'completed' },
      _sum: { total: true },
      _count: { id: true },
    });

    // Monthly revenue
    const monthSales = await prisma.sale.aggregate({
      where: { createdAt: { gte: monthStart, lte: monthEnd }, status: 'completed' },
      _sum: { total: true },
    });

    // Today's expenses
    const todayExpenses = await prisma.expense.aggregate({
      where: { expenseDate: { gte: todayStart, lte: todayEnd } },
      _sum: { amount: true },
    });

    // Total customers
    const totalCustomers = await prisma.customer.count({ where: { active: true } });

    // Total products
    const totalProducts = await prisma.product.count({ where: { active: true } });

    // Low stock products
    const settings = await prisma.setting.findMany();
    const settingsMap = Object.fromEntries(settings.map((s) => [s.settingKey, s.settingValue]));
    const lowStockThreshold = parseInt(settingsMap.low_stock_alert || '10');

    const lowStockProducts = await prisma.product.findMany({
      where: { active: true, stock: { lte: lowStockThreshold } },
      include: { category: { select: { name: true } } },
      orderBy: { stock: 'asc' },
      take: 10,
    });

    // Recent transactions
    const recentSales = await prisma.sale.findMany({
      where: { status: 'completed' },
      include: {
        customer: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Top selling products (current month)
    const topProducts = await prisma.saleItem.groupBy({
      by: ['productId', 'productName'],
      where: {
        sale: { createdAt: { gte: monthStart, lte: monthEnd }, status: 'completed' },
      },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    // Monthly chart data (last 6 months)
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = startOfMonth(subMonths(now, i));
      const mEnd = endOfMonth(subMonths(now, i));

      const [rev, exp] = await Promise.all([
        prisma.sale.aggregate({
          where: { createdAt: { gte: mStart, lte: mEnd }, status: 'completed' },
          _sum: { total: true },
        }),
        prisma.expense.aggregate({
          where: { expenseDate: { gte: mStart, lte: mEnd } },
          _sum: { amount: true },
        }),
      ]);

      chartData.push({
        month: format(mStart, 'MMM yy'),
        revenue: parseFloat(rev._sum.total || 0),
        expenses: parseFloat(exp._sum.amount || 0),
      });
    }

    return res.status(200).json({
      today: {
        revenue: parseFloat(todaySales._sum.total || 0),
        transactions: todaySales._count.id,
        expenses: parseFloat(todayExpenses._sum.amount || 0),
      },
      month: {
        revenue: parseFloat(monthSales._sum.total || 0),
      },
      totalCustomers,
      totalProducts,
      lowStockProducts,
      recentSales,
      topProducts,
      chartData,
      settings: settingsMap,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return res.status(500).json({ error: 'Failed to load stats' });
  }
}

export default withAuth(handler);
