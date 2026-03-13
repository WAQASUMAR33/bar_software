import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';

async function handler(req, res) {
  // POST – create a new running order for a table
  if (req.method === 'POST') {
    try {
      const { tableId, items, customerId, customerName, discount = 0, notes } = req.body;
      if (!tableId) return res.status(400).json({ error: 'tableId is required' });
      if (!items || items.length === 0) return res.status(400).json({ error: 'No items provided' });

      const order = await prisma.$transaction(async (tx) => {
        // Close any existing running order for this table first
        await tx.tableOrder.updateMany({
          where: { tableId: parseInt(tableId), status: { in: ['running', 'billed'] } },
          data: { status: 'cancelled' },
        });

        const newOrder = await tx.tableOrder.create({
          data: {
            tableId: parseInt(tableId),
            itemsJson: JSON.stringify(items),
            customerId: customerId ? parseInt(customerId) : null,
            customerName: customerName || null,
            discount: parseFloat(discount),
            notes: notes || null,
            status: 'running',
            createdBy: req.user.id,
          },
        });

        await tx.table.update({
          where: { id: parseInt(tableId) },
          data: { status: 'occupied' },
        });

        return newOrder;
      });

      return res.status(201).json({ order });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to create order' });
    }
  }

  return res.status(405).end();
}

export default withAuth(handler);
