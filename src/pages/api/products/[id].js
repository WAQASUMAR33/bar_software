import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';

async function handler(req, res) {
  const id = parseInt(req.query.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

  // GET
  if (req.method === 'GET') {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, variations: true },
    });
    if (!product) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({ product });
  }

  // Admin/manager only for mutations
  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // PUT – update
  if (req.method === 'PUT') {
    try {
      const { name, categoryId, price, costPrice, stock, barcode, image, description, active, variations, trackQuantity } = req.body;

      const product = await prisma.product.update({
        where: { id },
        data: {
          name: name?.trim(),
          categoryId: categoryId ? parseInt(categoryId) : null,
          price: price != null ? parseFloat(price) : undefined,
          costPrice: costPrice != null ? parseFloat(costPrice) : undefined,
          stock: stock != null ? parseInt(stock) : undefined,
          barcode: barcode?.trim() || null,
          image: image?.trim() || null,
          description: description?.trim() || null,
          active: active != null ? Boolean(active) : undefined,
          trackQuantity: trackQuantity != null ? Boolean(trackQuantity) : undefined,
        },
        include: { category: true, variations: true },
      });

      // Replace variations if provided
      if (variations !== undefined) {
        await prisma.productVariation.deleteMany({ where: { productId: id } });
        if (variations.length > 0) {
          await prisma.productVariation.createMany({
            data: variations.map((v) => ({
              productId: id,
              name: v.name,
              type: v.type,
              priceModifier: parseFloat(v.priceModifier || 0),
            })),
          });
        }
      }

      await prisma.activityLog.create({
        data: { userId: req.user.id, action: 'UPDATE_PRODUCT', description: `Updated product ID ${id}` },
      });

      return res.status(200).json({ product });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to update product' });
    }
  }

  // DELETE – soft delete
  if (req.method === 'DELETE') {
    try {
      await prisma.product.update({ where: { id }, data: { active: false } });
      await prisma.activityLog.create({
        data: { userId: req.user.id, action: 'DELETE_PRODUCT', description: `Deleted product ID ${id}` },
      });
      return res.status(200).json({ message: 'Deleted' });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to delete product' });
    }
  }

  return res.status(405).end();
}

export default withAuth(handler);
