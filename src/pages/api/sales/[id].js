import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';

async function handler(req, res) {
  const id = parseInt(req.query.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

  if (req.method === 'GET') {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        user: { select: { id: true, name: true } },
        items: true,
        splitPayments: true,
      },
    });
    if (!sale) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({ sale });
  }

  return res.status(405).end();
}

export default withAuth(handler);
