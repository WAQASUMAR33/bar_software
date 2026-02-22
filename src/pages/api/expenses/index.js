import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';

async function handler(req, res) {
  if (req.method === 'GET') {
    const { startDate, endDate, categoryId } = req.query;
    const where = {};
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate);
      if (endDate) where.expenseDate.lte = new Date(endDate);
    }
    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          user: { select: { name: true } },
        },
        orderBy: { expenseDate: 'desc' },
      }),
      prisma.expense.aggregate({ where, _sum: { amount: true } }),
    ]);
    return res.status(200).json({ expenses, totalAmount: parseFloat(total._sum.amount || 0) });
  }

  if (req.method === 'POST') {
    const { categoryId, amount, description, expenseDate } = req.body;
    if (!amount || !expenseDate) return res.status(400).json({ error: 'Amount and date required' });
    const expense = await prisma.expense.create({
      data: {
        categoryId: categoryId ? parseInt(categoryId) : null,
        userId: req.user.id,
        amount: parseFloat(amount),
        description: description?.trim() || null,
        expenseDate: new Date(expenseDate),
      },
      include: { category: true },
    });
    return res.status(201).json({ expense });
  }

  if (req.method === 'DELETE') {
    const id = parseInt(req.query.id);
    await prisma.expense.delete({ where: { id } });
    return res.status(200).json({ message: 'Deleted' });
  }

  return res.status(405).end();
}

export default withAuth(handler);
