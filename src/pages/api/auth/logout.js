import { clearTokenCookie, withAuth } from '@/lib/auth';
import prisma from '@/lib/db';

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      action: 'LOGOUT',
      description: 'User logged out',
    },
  });

  clearTokenCookie(res);
  return res.status(200).json({ message: 'Logged out' });
}

export default withAuth(handler);
