import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

async function handler(req, res) {
  if (!['admin'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const id = parseInt(req.query.id);

  if (req.method === 'PUT') {
    const { name, email, password, role, active } = req.body;
    const data = {
      name: name?.trim(),
      email: email?.toLowerCase().trim(),
      role,
      active: active != null ? Boolean(active) : undefined,
    };
    if (password) data.password = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, active: true },
    });
    return res.status(200).json({ user });
  }

  if (req.method === 'DELETE') {
    if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    await prisma.user.update({ where: { id }, data: { active: false } });
    return res.status(200).json({ message: 'Deleted' });
  }

  return res.status(405).end();
}

export default withAuth(handler);
