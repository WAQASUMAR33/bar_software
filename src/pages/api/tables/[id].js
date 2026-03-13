import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';

async function handler(req, res) {
  const { id } = req.query;
  const tableId = parseInt(id);

  if (isNaN(tableId)) return res.status(400).json({ error: 'Invalid table id' });

  // PATCH – update table status or details
  if (req.method === 'PATCH') {
    try {
      const { status, name, capacity, floor, isActive } = req.body;
      const data = {};
      if (status !== undefined) data.status = status;
      if (name !== undefined) data.name = name || null;
      if (capacity !== undefined) data.capacity = parseInt(capacity);
      if (floor !== undefined) data.floor = floor || null;
      if (isActive !== undefined) data.isActive = isActive;

      const table = await prisma.table.update({
        where: { id: tableId },
        data,
      });
      return res.status(200).json({ table });
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Table not found' });
      console.error(err);
      return res.status(500).json({ error: 'Failed to update table' });
    }
  }

  // DELETE – deactivate table (admin/manager only)
  if (req.method === 'DELETE') {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    try {
      await prisma.table.update({
        where: { id: tableId },
        data: { isActive: false },
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Table not found' });
      console.error(err);
      return res.status(500).json({ error: 'Failed to delete table' });
    }
  }

  return res.status(405).end();
}

export default withAuth(handler);
