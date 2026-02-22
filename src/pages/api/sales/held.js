import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';

async function handler(req, res) {
  if (req.method === 'GET') {
    const bills = await prisma.heldBill.findMany({ orderBy: { createdAt: 'desc' } });
    return res.status(200).json({ bills });
  }

  if (req.method === 'DELETE') {
    const id = parseInt(req.query.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    await prisma.heldBill.delete({ where: { id } });
    return res.status(200).json({ message: 'Deleted' });
  }

  return res.status(405).end();
}

export default withAuth(handler);
