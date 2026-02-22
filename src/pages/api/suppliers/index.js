import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';

async function handler(req, res) {
  if (req.method === 'GET') {
    const suppliers = await prisma.supplier.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json({ suppliers });
  }

  if (!['admin', 'manager'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'POST') {
    const { name, phone, email, address } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const supplier = await prisma.supplier.create({
      data: { name: name.trim(), phone: phone?.trim() || null, email: email?.trim() || null, address: address?.trim() || null },
    });
    return res.status(201).json({ supplier });
  }

  if (req.method === 'PUT') {
    const { id, name, phone, email, address, active } = req.body;
    const supplier = await prisma.supplier.update({
      where: { id: parseInt(id) },
      data: { name: name?.trim(), phone: phone?.trim() || null, email: email?.trim() || null, address: address?.trim() || null, active: active != null ? Boolean(active) : undefined },
    });
    return res.status(200).json({ supplier });
  }

  return res.status(405).end();
}

export default withAuth(handler);
