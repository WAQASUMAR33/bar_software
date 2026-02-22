import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';

async function handler(req, res) {
  if (req.method === 'GET') {
    const settings = await prisma.setting.findMany();
    const map = Object.fromEntries(settings.map((s) => [s.settingKey, s.settingValue]));
    return res.status(200).json({ settings: map });
  }

  if (!['admin'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'PUT') {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') return res.status(400).json({ error: 'Invalid data' });

    const ops = Object.entries(settings).map(([key, value]) =>
      prisma.setting.upsert({
        where: { settingKey: key },
        update: { settingValue: String(value) },
        create: { settingKey: key, settingValue: String(value) },
      })
    );
    await Promise.all(ops);

    await prisma.activityLog.create({
      data: { userId: req.user.id, action: 'UPDATE_SETTINGS', description: 'Settings updated' },
    });

    return res.status(200).json({ message: 'Settings saved' });
  }

  return res.status(405).end();
}

export default withAuth(handler);
