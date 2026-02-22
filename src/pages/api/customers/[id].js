import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';

async function handler(req, res) {
  const id = parseInt(req.query.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

  if (req.method === 'GET') {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: { orderBy: { createdAt: 'desc' }, take: 20, include: { items: true } },
        ledger: { orderBy: { createdAt: 'desc' }, take: 20 },
        payments: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!customer) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({ customer });
  }

  if (req.method === 'PUT') {
    const { name, phone, email, address, creditLimit, active } = req.body;
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: name?.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        creditLimit: creditLimit != null ? parseFloat(creditLimit) : undefined,
        active: active != null ? Boolean(active) : undefined,
      },
    });
    return res.status(200).json({ customer });
  }

  if (req.method === 'DELETE') {
    await prisma.customer.update({ where: { id }, data: { active: false } });
    return res.status(200).json({ message: 'Deleted' });
  }

  return res.status(405).end();
}

export default withAuth(handler);
