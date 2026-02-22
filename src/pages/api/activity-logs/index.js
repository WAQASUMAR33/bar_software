import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';

async function handler(req, res) {
  if (!['admin'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });

  const logs = await prisma.activityLog.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return res.status(200).json({ logs });
}

export default withAuth(handler);
