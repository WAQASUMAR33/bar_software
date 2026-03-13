import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';

async function handler(req, res) {
  // GET – list all tables with active order info
  if (req.method === 'GET') {
    try {
      const tables = await prisma.table.findMany({
        where: { isActive: true },
        orderBy: [{ floor: 'asc' }, { number: 'asc' }],
        include: {
          tableOrders: {
            where: { status: { in: ['running', 'billed'] } },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
      return res.status(200).json({ tables });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch tables' });
    }
  }

  // POST – create a new table (admin/manager only)
  if (req.method === 'POST') {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    try {
      const { number, name, capacity = 4, floor } = req.body;
      if (!number) return res.status(400).json({ error: 'Table number is required' });

      const table = await prisma.table.create({
        data: {
          number: parseInt(number),
          name: name || null,
          capacity: parseInt(capacity),
          floor: floor || null,
        },
      });
      return res.status(201).json({ table });
    } catch (err) {
      if (err.code === 'P2002') {
        return res.status(400).json({ error: 'Table number already exists' });
      }
      console.error(err);
      return res.status(500).json({ error: 'Failed to create table' });
    }
  }

  return res.status(405).end();
}

export default withAuth(handler);
