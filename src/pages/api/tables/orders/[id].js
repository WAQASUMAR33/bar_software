import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';

async function handler(req, res) {
  const { id } = req.query;
  const orderId = parseInt(id);
  if (isNaN(orderId)) return res.status(400).json({ error: 'Invalid order id' });

  // GET – return order with parsed items
  if (req.method === 'GET') {
    try {
      const order = await prisma.tableOrder.findUnique({
        where: { id: orderId },
        include: { table: true },
      });
      if (!order) return res.status(404).json({ error: 'Order not found' });
      return res.status(200).json({
        order: { ...order, items: JSON.parse(order.itemsJson || '[]') },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch order' });
    }
  }

  // PATCH – update items, discount, notes, status
  if (req.method === 'PATCH') {
    try {
      const { items, discount, notes, status, customerId, customerName } = req.body;
      const data = {};
      if (items !== undefined) data.itemsJson = JSON.stringify(items);
      if (discount !== undefined) data.discount = parseFloat(discount);
      if (notes !== undefined) data.notes = notes || null;
      if (status !== undefined) data.status = status;
      if (customerId !== undefined) data.customerId = customerId ? parseInt(customerId) : null;
      if (customerName !== undefined) data.customerName = customerName || null;

      const order = await prisma.tableOrder.update({ where: { id: orderId }, data });
      return res.status(200).json({ order });
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Order not found' });
      console.error(err);
      return res.status(500).json({ error: 'Failed to update order' });
    }
  }

  // DELETE – cancel order and free the table
  if (req.method === 'DELETE') {
    try {
      const order = await prisma.tableOrder.findUnique({
        where: { id: orderId },
        select: { tableId: true },
      });
      if (!order) return res.status(404).json({ error: 'Order not found' });

      await prisma.$transaction([
        prisma.tableOrder.delete({ where: { id: orderId } }),
        prisma.table.update({ where: { id: order.tableId }, data: { status: 'free' } }),
      ]);

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to cancel order' });
    }
  }

  return res.status(405).end();
}

export default withAuth(handler);
