import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';
import { generatePurchaseNumber } from '@/lib/utils';

async function handler(req, res) {
  if (req.method === 'GET') {
    const { page = 1, limit = 20 } = req.query;
    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        include: {
          supplier: { select: { id: true, name: true } },
          user: { select: { name: true } },
          items: { include: { product: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.purchase.count(),
    ]);
    return res.status(200).json({ purchases, total });
  }

  if (!['admin', 'manager'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'POST') {
    const { supplierId, items, notes } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'No items' });

    try {
      const purchaseNumber = generatePurchaseNumber();
      const total = items.reduce((s, i) => s + parseFloat(i.costPrice) * parseInt(i.quantity), 0);

      const purchase = await prisma.$transaction(async (tx) => {
        const p = await tx.purchase.create({
          data: {
            purchaseNumber,
            supplierId: supplierId ? parseInt(supplierId) : null,
            userId: req.user.id,
            total,
            notes: notes || null,
            status: 'received',
            items: {
              create: items.map((i) => ({
                productId: parseInt(i.productId),
                quantity: parseInt(i.quantity),
                costPrice: parseFloat(i.costPrice),
                total: parseFloat(i.costPrice) * parseInt(i.quantity),
              })),
            },
          },
          include: { items: { include: { product: true } }, supplier: true },
        });

        // Increment stock
        for (const item of items) {
          await tx.product.update({
            where: { id: parseInt(item.productId) },
            data: { stock: { increment: parseInt(item.quantity) }, costPrice: parseFloat(item.costPrice) },
          });
        }

        return p;
      });

      await prisma.activityLog.create({
        data: { userId: req.user.id, action: 'CREATE_PURCHASE', description: `Purchase ${purchaseNumber}` },
      });

      return res.status(201).json({ purchase });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to create purchase' });
    }
  }

  return res.status(405).end();
}

export default withAuth(handler);
