import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!['admin', 'manager'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });

  const { productId, type, quantity, reason } = req.body;
  if (!productId || !type || !quantity) return res.status(400).json({ error: 'Missing fields' });

  try {
    const product = await prisma.product.findUnique({ where: { id: parseInt(productId) } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const qty = parseInt(quantity);
    let newStock = product.stock;
    if (type === 'in') newStock += qty;
    else if (type === 'out') newStock = Math.max(0, newStock - qty);
    else newStock = qty; // direct adjustment

    await prisma.$transaction([
      prisma.product.update({ where: { id: product.id }, data: { stock: newStock } }),
      prisma.stockAdjustment.create({
        data: {
          productId: product.id,
          userId: req.user.id,
          type,
          quantity: qty,
          previousStock: product.stock,
          newStock,
          reason: reason || null,
        },
      }),
    ]);

    return res.status(200).json({ message: 'Stock adjusted', newStock });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to adjust stock' });
  }
}

export default withAuth(handler);
