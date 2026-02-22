import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';

async function handler(req, res) {
  const id = parseInt(req.query.id);
  if (!['admin', 'manager'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'PUT') {
    const { name, description, active } = req.body;
    const category = await prisma.category.update({
      where: { id },
      data: { name: name?.trim(), description: description?.trim(), active: active != null ? Boolean(active) : undefined },
    });
    return res.status(200).json({ category });
  }

  if (req.method === 'DELETE') {
    await prisma.category.update({ where: { id }, data: { active: false } });
    return res.status(200).json({ message: 'Deleted' });
  }

  return res.status(405).end();
}

export default withAuth(handler);
