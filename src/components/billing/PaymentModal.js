import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

const METHODS = [
  { value: 'cash',   label: 'Cash',   icon: '💵' },
  { value: 'card',   label: 'Card',   icon: '💳' },
  { value: 'online', label: 'Online', icon: '📱' },
  { value: 'credit', label: 'Credit', icon: '📒' },
  { value: 'split',  label: 'Split',  icon: '🔀' },
];

export default function PaymentModal({ isOpen, onClose, onSuccess, customers = [], taxRate = 0, symbol = 'PKR ', orderType = 'dine_in', tableId = null }) {
  const { items, customer, discount, subtotal, total, setCustomer } = useCart();

  const [method, setMethod] = useState('cash');
  const [cashTendered, setCashTendered] = useState('');
  const [splitAmounts, setSplitAmounts] = useState({ cash: '', card: '', online: '' });
  const [selectedCustomerId, setSelectedCustomerId] = useState(customer?.id || '');
  const [loading, setLoading] = useState(false);

  const tax = total * (taxRate / 100);
  const finalTotal = total + tax;
  const change = method === 'cash' ? Math.max(0, parseFloat(cashTendered || 0) - finalTotal) : 0;

  async function handleSubmit() {
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    if (method === 'cash' && parseFloat(cashTendered || 0) < finalTotal) {
      toast.error('Insufficient cash amount');
      return;
    }
    if (method === 'credit' && !selectedCustomerId) {
      toast.error('Select a customer for credit sale');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        items,
        customerId: selectedCustomerId || null,
        discount,
        tax,
        subtotal,
        total: finalTotal,
        paymentMethod: method,
        cashTendered: method === 'cash' ? parseFloat(cashTendered || 0) : 0,
        changeAmount: change,
        orderType,
        tableId: tableId || null,
        splitPayments: method === 'split'
          ? Object.entries(splitAmounts)
              .filter(([, v]) => parseFloat(v) > 0)
              .map(([m, v]) => ({ method: m, amount: parseFloat(v) }))
          : [],
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process sale');

      toast.success('Sale completed!');
      onSuccess(data.sale);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Process Payment" size="md">
      {/* Customer */}
      <div className="mb-4">
        <label className="label">Customer</label>
        <select
          value={selectedCustomerId}
          onChange={(e) => {
            setSelectedCustomerId(e.target.value);
            const c = customers.find((x) => String(x.id) === e.target.value);
            setCustomer(c || null);
          }}
          className="input"
        >
          <option value="">Walk-in Customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.phone ? `(${c.phone})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Order summary */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-1.5 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal, symbol)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-red-500">
            <span>Discount</span>
            <span>-{formatCurrency(discount, symbol)}</span>
          </div>
        )}
        {taxRate > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Tax ({taxRate}%)</span>
            <span>{formatCurrency(tax, symbol)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
          <span>Total</span>
          <span className="text-blue-600">{formatCurrency(finalTotal, symbol)}</span>
        </div>
      </div>

      {/* Payment method */}
      <div className="mb-4">
        <label className="label">Payment Method</label>
        <div className="grid grid-cols-5 gap-2">
          {METHODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMethod(m.value)}
              className={`p-2 rounded-xl border-2 text-center transition-colors ${
                method === m.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-xl">{m.icon}</div>
              <div className="text-xs font-medium mt-0.5">{m.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Cash tendered */}
      {method === 'cash' && (
        <div className="mb-4">
          <label className="label">Cash Tendered</label>
          <input
            type="number"
            value={cashTendered}
            onChange={(e) => setCashTendered(e.target.value)}
            placeholder={`Minimum ${formatCurrency(finalTotal, symbol)}`}
            className="input text-lg font-bold"
            min={finalTotal}
          />
          {parseFloat(cashTendered || 0) >= finalTotal && (
            <div className="mt-2 p-3 bg-green-50 rounded-xl">
              <p className="text-sm text-green-700 font-medium">
                Change: <span className="font-bold text-lg">{formatCurrency(change, symbol)}</span>
              </p>
            </div>
          )}
          {/* Quick amounts */}
          <div className="flex gap-2 mt-2 flex-wrap">
            {[Math.ceil(finalTotal), Math.ceil(finalTotal / 5) * 5 + 5, Math.ceil(finalTotal / 10) * 10].map((amt) => (
              <button
                key={amt}
                onClick={() => setCashTendered(String(amt))}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-blue-100 rounded-lg font-medium text-gray-700 transition-colors"
              >
                {formatCurrency(amt, symbol)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Split payment */}
      {method === 'split' && (
        <div className="mb-4 space-y-3">
          <label className="label">Split Amounts (Total: {formatCurrency(finalTotal, symbol)})</label>
          {['cash', 'card', 'online'].map((m) => (
            <div key={m} className="flex items-center gap-3">
              <label className="text-sm text-gray-600 w-16 capitalize">{m}</label>
              <input
                type="number"
                value={splitAmounts[m]}
                onChange={(e) => setSplitAmounts((prev) => ({ ...prev, [m]: e.target.value }))}
                placeholder="0.00"
                className="input text-sm"
                min="0"
              />
            </div>
          ))}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="btn btn-success w-full text-lg py-4 mt-2"
      >
        {loading ? 'Processing...' : `Confirm Payment — ${formatCurrency(finalTotal, symbol)}`}
      </button>
    </Modal>
  );
}
