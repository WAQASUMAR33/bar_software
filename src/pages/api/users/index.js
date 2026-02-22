import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

async function handler(req, res) {
  if (!['admin'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'GET') {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json({ users });
  }

  if (req.method === 'POST') {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });

    const hashed = await bcrypt.hash(password, 10);
    try {
      const user = await prisma.user.create({
        data: { name: name.trim(), email: email.toLowerCase().trim(), password: hashed, role: role || 'cashier' },
        select: { id: true, name: true, email: true, role: true, active: true },
      });
      return res.status(201).json({ user });
    } catch (err) {
      if (err.code === 'P2002') return res.status(409).json({ error: 'Email already exists' });
      return res.status(500).json({ error: 'Failed to create user' });
    }
  }

  return res.status(405).end();
}

export default withAuth(handler);
