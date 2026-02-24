import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';

async function handler(req, res) {
  // GET – list products
  if (req.method === 'GET') {
    try {
      const { search, categoryId, active, page = 1, limit = 100 } = req.query;
      const where = {};
      if (active !== undefined) where.active = active === 'true';
      if (categoryId) where.categoryId = parseInt(categoryId);
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { barcode: { contains: search } },
        ];
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: { select: { id: true, name: true } },
            variations: true,
          },
          orderBy: { name: 'asc' },
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit),
        }),
        prisma.product.count({ where }),
      ]);

      return res.status(200).json({ products, total });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
  }

  // POST – create product (admin/manager only)
  if (req.method === 'POST') {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    try {
      const { name, categoryId, price, costPrice, stock, barcode, image, description, variations, trackQuantity } = req.body;
      if (!name || price == null || costPrice == null) {
        return res.status(400).json({ error: 'Name, price and cost price are required' });
      }

      const product = await prisma.product.create({
        data: {
          name: name.trim(),
          categoryId: categoryId ? parseInt(categoryId) : null,
          price: parseFloat(price),
          costPrice: parseFloat(costPrice),
          stock: parseInt(stock || 0),
          barcode: barcode?.trim() || null,
          image: image?.trim() || null,
          description: description?.trim() || null,
          trackQuantity: trackQuantity !== false,
          variations: variations?.length
            ? { create: variations.map((v) => ({ name: v.name, type: v.type, priceModifier: parseFloat(v.priceModifier || 0) })) }
            : undefined,
        },
        include: { category: true, variations: true },
      });

      await prisma.activityLog.create({
        data: { userId: req.user.id, action: 'CREATE_PRODUCT', description: `Created product: ${name}` },
      });

      return res.status(201).json({ product });
    } catch (err) {
      console.error(err);
      if (err.code === 'P2002') return res.status(409).json({ error: 'Barcode already exists' });
      return res.status(500).json({ error: 'Failed to create product' });
    }
  }

  return res.status(405).end();
}

export default withAuth(handler);
