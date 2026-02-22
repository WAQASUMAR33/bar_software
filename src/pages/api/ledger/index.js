import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';

async function handler(req, res) {
  if (req.method === 'GET') {
    const { customerId, startDate, endDate } = req.query;
    const where = {};
    if (customerId) where.customerId = parseInt(customerId);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59');
    }
    const ledger = await prisma.customerLedger.findMany({
      where,
      include: { customer: { select: { id: true, name: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ ledger });
  }

  return res.status(405).end();
}

export default withAuth(handler);
