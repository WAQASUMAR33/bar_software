import { withAuth } from '@/lib/auth';
import prisma from '@/lib/db';

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { items, customerId, customerName, discount, notes } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'No items' });

    const reference = `HOLD-${Date.now()}`;
    const bill = await prisma.heldBill.create({
      data: {
        reference,
        itemsJson: JSON.stringify(items),
        customerId: customerId ? parseInt(customerId) : null,
        customerName: customerName || null,
        discount: parseFloat(discount || 0),
        notes: notes || null,
        createdBy: req.user.id,
      },
    });

    return res.status(201).json({ bill, message: 'Bill held successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to hold bill' });
  }
}

export default withAuth(handler);
