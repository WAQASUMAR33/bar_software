import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { useCart } from '@/context/CartContext';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function HeldBillsModal({ isOpen, onClose, symbol = 'PKR ' }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const { clearCart, setDiscount, setCustomer, addItem } = useCart();

  useEffect(() => {
    if (isOpen) fetchHeld();
  }, [isOpen]);

  async function fetchHeld() {
    setLoading(true);
    try {
      const res = await fetch('/api/sales/held');
      const data = await res.json();
      setBills(data.bills || []);
    } catch {
      toast.error('Failed to load held bills');
    } finally {
      setLoading(false);
    }
  }

  async function resumeBill(bill) {
    try {
      const items = JSON.parse(bill.itemsJson);
      clearCart();
      items.forEach((item) => {
        // Directly add each item to cart context state
        addItem(
          { id: item.id, name: item.name, price: item.price, category_name: item.category },
          item.variation ? { name: item.variation, price_modifier: 0 } : null
        );
      });
      if (bill.discount) setDiscount(parseFloat(bill.discount));
      if (bill.customerId) setCustomer({ id: bill.customerId, name: bill.customerName });

      // Delete the held bill
      await fetch(`/api/sales/held?id=${bill.id}`, { method: 'DELETE' });
      toast.success(`Bill "${bill.reference}" resumed`);
      onClose();
    } catch {
      toast.error('Failed to resume bill');
    }
  }

  async function deleteBill(id) {
    try {
      await fetch(`/api/sales/held?id=${id}`, { method: 'DELETE' });
      setBills((prev) => prev.filter((b) => b.id !== id));
      toast.success('Held bill removed');
    } catch {
      toast.error('Failed to delete bill');
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Held Bills" size="md">
      {loading ? (
        <div className="py-12 text-center text-gray-400">Loading...</div>
      ) : bills.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <p className="text-3xl mb-2">📋</p>
          <p>No held bills</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map((bill) => {
            let items = [];
            try { items = JSON.parse(bill.itemsJson); } catch {}
            const billTotal = items.reduce((s, i) => s + i.total, 0);

            return (
              <div key={bill.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{bill.reference}</p>
                    <p className="text-xs text-gray-400">{formatDateTime(bill.createdAt)}</p>
                    {bill.customerName && (
                      <p className="text-xs text-gray-500 mt-0.5">{bill.customerName}</p>
                    )}
                    <p className="text-sm mt-1">
                      {items.length} item(s) — <span className="font-bold text-blue-600">{formatCurrency(billTotal, symbol)}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => resumeBill(bill)} className="btn btn-primary btn-sm">
                      Resume
                    </button>
                    <button onClick={() => deleteBill(bill.id)} className="btn btn-danger btn-sm">
                      ✕
                    </button>
                  </div>
                </div>
                {bill.notes && (
                  <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-2">{bill.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
