import { useState, useEffect, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import Receipt from '@/components/billing/Receipt';
import { useReactToPrint } from 'react-to-print';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { value: 'cash',   label: 'Cash',   icon: '💵' },
  { value: 'card',   label: 'Card',   icon: '💳' },
  { value: 'online', label: 'Online', icon: '📱' },
  { value: 'credit', label: 'Credit', icon: '📒' },
  { value: 'split',  label: 'Split',  icon: '🔀' },
];

export default function TableOrderModal({
  isOpen,
  onClose,
  table,
  order: initialOrder,
  onPaid,
  symbol = 'PKR ',
  taxRate = 0,
  settings = {},
}) {
  const [items, setItems]                   = useState([]);
  const [discount, setDiscount]             = useState(0);
  const [notes, setNotes]                   = useState('');
  const [view, setView]                     = useState('edit'); // 'edit' | 'bill' | 'payment'
  const [customers, setCustomers]           = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [method, setMethod]                 = useState('cash');
  const [cashTendered, setCashTendered]     = useState('');
  const [splitAmounts, setSplitAmounts]     = useState({ cash: '', card: '', online: '' });
  const [saving, setSaving]                 = useState(false);
  const [products, setProducts]             = useState([]);
  const [productSearch, setProductSearch]   = useState('');
  const [showAddItems, setShowAddItems]     = useState(false);

  const billRef = useRef();
  const handlePrint = useReactToPrint({ content: () => billRef.current });

  // Reset state when modal opens with a new order
  useEffect(() => {
    if (!isOpen || !initialOrder) return;
    try {
      setItems(JSON.parse(initialOrder.itemsJson || '[]'));
    } catch { setItems([]); }
    setDiscount(parseFloat(initialOrder.discount || 0));
    setNotes(initialOrder.notes || '');
    setSelectedCustomerId(initialOrder.customerId ? String(initialOrder.customerId) : '');
    // If order is already billed, go straight to bill view
    setView(initialOrder.status === 'billed' ? 'bill' : 'edit');
    setMethod('cash');
    setCashTendered('');
    setSplitAmounts({ cash: '', card: '', online: '' });
  }, [isOpen, initialOrder]);

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      fetch('/api/customers').then((r) => r.json()),
      fetch('/api/products?active=true&limit=200').then((r) => r.json()),
    ]).then(([cu, pr]) => {
      setCustomers(cu.customers || []);
      setProducts(pr.products || []);
    });
    setProductSearch('');
    setShowAddItems(false);
  }, [isOpen]);

  // ── Calculated totals ──────────────────────────────────────────
  const subtotal  = items.reduce((s, i) => s + (i.total || 0), 0);
  const tax       = subtotal * (taxRate / 100);
  const finalTotal = subtotal - discount + tax;
  const change    = method === 'cash' ? Math.max(0, parseFloat(cashTendered || 0) - finalTotal) : 0;

  // ── Item editing ──────────────────────────────────────────────
  function changeQty(idx, delta) {
    setItems((prev) =>
      prev
        .map((item, i) => {
          if (i !== idx) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          const unitNet = item.price - (item.discount || 0);
          return { ...item, quantity: newQty, total: unitNet * newQty };
        })
        .filter(Boolean)
    );
  }

  function removeItem(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function addProduct(product) {
    setItems((prev) => {
      const key = `${product.id}_`;
      const existing = prev.findIndex((i) => `${i.id}_${i.variation || ''}` === key);
      if (existing >= 0) {
        return prev.map((item, i) => {
          if (i !== existing) return item;
          const newQty = item.quantity + 1;
          const unitNet = item.price - (item.discount || 0);
          return { ...item, quantity: newQty, total: unitNet * newQty };
        });
      }
      const price = parseFloat(product.price);
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          variation: null,
          price,
          discount: 0,
          quantity: 1,
          total: price,
        },
      ];
    });
  }

  // ── Step 1→2: Generate Bill ───────────────────────────────────
  async function handleGenerateBill() {
    if (items.length === 0) { toast.error('No items in order'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/tables/orders/${initialOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, discount, notes, status: 'billed' }),
      });
      if (!res.ok) throw new Error('Failed to save bill');
      setView('bill');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Step 2→1: Edit Bill ───────────────────────────────────────
  async function handleEditBill() {
    await fetch(`/api/tables/orders/${initialOrder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'running' }),
    });
    setView('edit');
  }

  // ── Cancel order ──────────────────────────────────────────────
  async function handleCancelOrder() {
    if (!window.confirm('Cancel this order and free the table?')) return;
    try {
      await fetch(`/api/tables/orders/${initialOrder.id}`, { method: 'DELETE' });
      toast.success('Order cancelled');
      onClose();
    } catch {
      toast.error('Failed to cancel order');
    }
  }

  // ── Step 3: Process Payment ───────────────────────────────────
  async function handleCheckout() {
    if (method === 'cash' && parseFloat(cashTendered || 0) < finalTotal) {
      toast.error('Insufficient cash amount');
      return;
    }
    if (method === 'credit' && !selectedCustomerId) {
      toast.error('Select a customer for credit sale');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/tables/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: initialOrder.id,
          paymentMethod: method,
          cashTendered: method === 'cash' ? parseFloat(cashTendered || 0) : 0,
          changeAmount: change,
          customerId: selectedCustomerId || null,
          tax,
          discount,
          subtotal,
          total: finalTotal,
          splitPayments:
            method === 'split'
              ? Object.entries(splitAmounts)
                  .filter(([, v]) => parseFloat(v) > 0)
                  .map(([m, v]) => ({ method: m, amount: parseFloat(v) }))
              : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process payment');
      toast.success('Payment processed!');
      onPaid(data.sale);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Bill preview object (mirrors Sale shape for Receipt component) ──
  const selectedCustomer = customers.find((c) => String(c.id) === selectedCustomerId) || null;
  const previewSale = {
    saleNumber: `T${table?.number}-BILL`,
    createdAt: new Date().toISOString(),
    customer: selectedCustomer,
    items: items.map((item) => ({
      productName: item.name,
      variation: item.variation || null,
      quantity: item.quantity,
      price: item.price,
      discount: item.discount || 0,
      total: item.total,
    })),
    subtotal,
    discount,
    tax,
    total: finalTotal,
    paymentMethod: 'Pending',
  };

  const titleMap = {
    edit: `Table ${table?.number} — Running Order`,
    bill: `Table ${table?.number} — Bill Preview`,
    payment: `Table ${table?.number} — Process Payment`,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titleMap[view]} size="lg">

      {/* ── STEP INDICATOR ────────────────────────────── */}
      <div className="flex items-center gap-1 mb-5">
        {[
          { key: 'edit',    label: '1. Order', step: 1 },
          { key: 'bill',    label: '2. Bill',  step: 2 },
          { key: 'payment', label: '3. Pay',   step: 3 },
        ].map((s, i) => {
          const stepNum = { edit: 1, bill: 2, payment: 3 }[view];
          const done    = s.step < stepNum;
          const active  = s.step === stepNum;
          return (
            <div key={s.key} className="flex items-center flex-1">
              <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                active ? 'bg-blue-600 text-white' :
                done   ? 'bg-green-100 text-green-700' :
                         'bg-gray-100 text-gray-400'
              }`}>
                {done ? '✓' : s.step} {s.label}
              </div>
              {i < 2 && <div className="flex-1 h-px bg-gray-200 mx-1" />}
            </div>
          );
        })}
      </div>

      {/* ── VIEW A: EDIT ORDER ────────────────────────── */}
      {view === 'edit' && (
        <div>
          {items.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-2">🍽️</div>
              <p>No items in this order</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 mb-4">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {item.name}
                      {item.variation ? ` (${item.variation})` : ''}
                    </p>
                    <p className="text-xs text-gray-400">{formatCurrency(item.price, symbol)} each</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => changeQty(idx, -1)}
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-600 font-bold"
                    >−</button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      onClick={() => changeQty(idx, +1)}
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-green-100 text-gray-600 font-bold"
                    >+</button>
                  </div>
                  <div className="text-sm font-semibold w-20 text-right flex-shrink-0">
                    {formatCurrency(item.total, symbol)}
                  </div>
                  <button
                    onClick={() => removeItem(idx)}
                    className="text-red-400 hover:text-red-600 text-lg leading-none flex-shrink-0"
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Add items panel */}
          <div className="mb-4">
            <button
              onClick={() => setShowAddItems((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold transition-colors"
            >
              <span>+ Add Items to Order</span>
              <span>{showAddItems ? '▲' : '▼'}</span>
            </button>
            {showAddItems && (
              <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                    className="input text-sm"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                  {products
                    .filter((p) =>
                      !productSearch ||
                      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                      (p.barcode && p.barcode.toLowerCase().includes(productSearch.toLowerCase()))
                    )
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => addProduct(p)}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-blue-50 text-left transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-800 truncate">{p.name}</span>
                        <span className="text-sm font-semibold text-blue-600 ml-2 flex-shrink-0">
                          {formatCurrency(parseFloat(p.price), symbol)}
                        </span>
                      </button>
                    ))}
                  {products.filter((p) =>
                    !productSearch ||
                    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                    (p.barcode && p.barcode.toLowerCase().includes(productSearch.toLowerCase()))
                  ).length === 0 && (
                    <div className="px-3 py-4 text-center text-sm text-gray-400">No products found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="label">Discount</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="input"
                min="0"
              />
            </div>
            <div>
              <label className="label">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-xl p-3 mb-5 text-sm space-y-1">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span><span>{formatCurrency(subtotal, symbol)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Discount</span><span>-{formatCurrency(discount, symbol)}</span>
              </div>
            )}
            {taxRate > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Tax ({taxRate}%)</span><span>{formatCurrency(tax, symbol)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
              <span>Total</span>
              <span className="text-blue-600">{formatCurrency(finalTotal, symbol)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleCancelOrder} className="btn btn-danger">
              Cancel Order
            </button>
            <button
              onClick={handleGenerateBill}
              disabled={saving || items.length === 0}
              className="btn btn-primary flex-1"
            >
              {saving ? 'Saving...' : 'Generate Bill →'}
            </button>
          </div>
        </div>
      )}

      {/* ── VIEW B: BILL PREVIEW ──────────────────────── */}
      {view === 'bill' && (
        <div>
          <div className="border border-dashed border-gray-300 rounded-xl overflow-hidden mb-4 max-h-96 overflow-y-auto">
            <Receipt ref={billRef} sale={previewSale} settings={settings} />
          </div>
          <div className="flex gap-3">
            <button onClick={handlePrint} className="btn btn-outline flex-1">
              🖨️ Print Bill
            </button>
            <button onClick={handleEditBill} className="btn btn-secondary flex-1">
              ✏️ Edit Bill
            </button>
            <button onClick={() => setView('payment')} className="btn btn-success flex-1">
              Process Payment →
            </button>
          </div>
        </div>
      )}

      {/* ── VIEW C: PAYMENT ───────────────────────────── */}
      {view === 'payment' && (
        <div>
          {/* Customer */}
          <div className="mb-4">
            <label className="label">Customer</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
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
          <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm space-y-1">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span><span>{formatCurrency(subtotal, symbol)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Discount</span><span>-{formatCurrency(discount, symbol)}</span>
              </div>
            )}
            {taxRate > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Tax ({taxRate}%)</span><span>{formatCurrency(tax, symbol)}</span>
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
              {PAYMENT_METHODS.map((m) => (
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
                    onChange={(e) => setSplitAmounts((p) => ({ ...p, [m]: e.target.value }))}
                    placeholder="0.00"
                    className="input text-sm"
                    min="0"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <button onClick={() => setView('bill')} className="btn btn-secondary flex-1">
              ← Back
            </button>
            <button
              onClick={handleCheckout}
              disabled={saving}
              className="btn btn-success flex-1 text-lg py-4"
            >
              {saving ? 'Processing...' : `Confirm Payment — ${formatCurrency(finalTotal, symbol)}`}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
