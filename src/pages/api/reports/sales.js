import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';
import { startOfDay, endOfDay } from 'date-fns';

async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  if (!['admin', 'manager'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });

  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const start = startDate ? startOfDay(new Date(startDate)) : startOfDay(new Date());
    const end = endDate ? endOfDay(new Date(endDate)) : endOfDay(new Date());

    // Overall summary
    const summary = await prisma.sale.aggregate({
      where: { createdAt: { gte: start, lte: end }, status: 'completed' },
      _sum: { total: true, discount: true, tax: true },
      _count: { id: true },
    });

    // By payment method
    const byPaymentMethod = await prisma.sale.groupBy({
      by: ['paymentMethod'],
      where: { createdAt: { gte: start, lte: end }, status: 'completed' },
      _sum: { total: true },
      _count: { id: true },
    });

    // Top products
    const topProducts = await prisma.saleItem.groupBy({
      by: ['productId', 'productName'],
      where: { sale: { createdAt: { gte: start, lte: end }, status: 'completed' } },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 10,
    });

    // Transactions list
    const transactions = await prisma.sale.findMany({
      where: { createdAt: { gte: start, lte: end }, status: { not: 'held' } },
      include: {
        customer: { select: { name: true } },
        user: { select: { name: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Category-wise
    const categoryWise = await prisma.saleItem.findMany({
      where: { sale: { createdAt: { gte: start, lte: end }, status: 'completed' } },
      include: { product: { include: { category: { select: { name: true } } } } },
    });

    const categoryTotals = {};
    for (const item of categoryWise) {
      const cat = item.product?.category?.name || 'Uncategorized';
      if (!categoryTotals[cat]) categoryTotals[cat] = { name: cat, total: 0, quantity: 0 };
      categoryTotals[cat].total += parseFloat(item.total);
      categoryTotals[cat].quantity += item.quantity;
    }

    return res.status(200).json({
      summary: {
        revenue: parseFloat(summary._sum.total || 0),
        discount: parseFloat(summary._sum.discount || 0),
        tax: parseFloat(summary._sum.tax || 0),
        transactions: summary._count.id,
      },
      byPaymentMethod,
      topProducts,
      categoryWise: Object.values(categoryTotals),
      transactions,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to generate report' });
  }
}

export default withAuth(handler);
