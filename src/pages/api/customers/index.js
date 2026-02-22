import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';

async function handler(req, res) {
  if (req.method === 'GET') {
    const { search } = req.query;
    const where = { active: true };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }
    const customers = await prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return res.status(200).json({ customers });
  }

  if (req.method === 'POST') {
    const { name, phone, email, address, creditLimit } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        creditLimit: parseFloat(creditLimit || 0),
      },
    });
    return res.status(201).json({ customer });
  }

  return res.status(405).end();
}

export default withAuth(handler);
