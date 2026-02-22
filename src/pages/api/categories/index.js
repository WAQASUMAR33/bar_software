import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';

async function handler(req, res) {
  if (req.method === 'GET') {
    const categories = await prisma.category.findMany({
      where: req.query.all ? {} : { active: true },
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json({ categories });
  }

  if (!['admin', 'manager'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'POST') {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const category = await prisma.category.create({
      data: { name: name.trim(), description: description?.trim() },
    });
    return res.status(201).json({ category });
  }

  return res.status(405).end();
}

export default withAuth(handler);
