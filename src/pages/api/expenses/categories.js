import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';

async function handler(req, res) {
  if (req.method === 'GET') {
    const cats = await prisma.expenseCategory.findMany({ orderBy: { name: 'asc' } });
    return res.status(200).json({ categories: cats });
  }

  if (!['admin', 'manager'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'POST') {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const cat = await prisma.expenseCategory.create({ data: { name: name.trim() } });
    return res.status(201).json({ category: cat });
  }

  return res.status(405).end();
}

export default withAuth(handler);
