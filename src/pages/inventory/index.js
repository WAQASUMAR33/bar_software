import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Modal from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [open, setOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [form, setForm] = useState({ supplierId: '', notes: '', items: [{ productId: '', quantity: '', costPrice: '' }] });
  const [adjustForm, setAdjustForm] = useState({ productId: '', type: 'in', quantity: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [symbol, setSymbol] = useState('PKR ');

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then((d) => setSymbol(d.settings?.currency_symbol || 'PKR '));
    fetchAll();
  }, []);

  async function fetchAll() {
    const [purch, prod, supp] = await Promise.all([
      fetch('/api/inventory').then((r) => r.json()),
      fetch('/api/products?active=true&limit=500').then((r) => r.json()),
      fetch('/api/suppliers').then((r) => r.json()),
    ]);
    setPurchases(purch.purchases || []);
    setProducts(prod.products || []);
    setSuppliers(supp.suppliers || []);
  }

  function addItem() {
    setForm({ ...form, items: [...form.items, { productId: '', quantity: '', costPrice: '' }] });
  }

  function updateItem(i, field, val) {
    const items = [...form.items];
    items[i][field] = val;
    // Auto-fill cost price from product
    if (field === 'productId') {
      const p = products.find((x) => String(x.id) === val);
      if (p) items[i].costPrice = String(p.costPrice);
    }
    setForm({ ...form, items });
  }

  async function handlePurchase(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Purchase recorded & stock updated');
      setOpen(false);
      setForm({ supplierId: '', notes: '', items: [{ productId: '', quantity: '', costPrice: '' }] });
      fetchAll();
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  }

  async function handleAdjust(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adjustForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Stock adjusted. New stock: ${data.newStock}`);
      setAdjustOpen(false);
      fetchAll();
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  }

  const total = form.items.reduce((s, i) => s + (parseFloat(i.costPrice || 0) * parseInt(i.quantity || 0)), 0);

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex gap-3 justify-end">
          <button onClick={() => setAdjustOpen(true)} className="btn btn-secondary">Adjust Stock</button>
          <button onClick={() => setOpen(true)} className="btn btn-primary">+ New Purchase</button>
        </div>

        {/* Stock overview */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Current Stock Overview</h3>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Product</th><th>Category</th><th className="text-right">Stock</th><th className="text-right">Cost Price</th><th>Status</th></tr></thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.name}</td>
                    <td>{p.category?.name || '–'}</td>
                    <td className="text-right">
                      <span className={`font-bold ${p.stock === 0 ? 'text-red-600' : p.stock <= 10 ? 'text-orange-500' : 'text-gray-800'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="text-right">{formatCurrency(p.costPrice, symbol)}</td>
                    <td>
                      {p.stock === 0 ? <span className="badge badge-danger">Out of Stock</span>
                       : p.stock <= 10 ? <span className="badge badge-warning">Low Stock</span>
                       : <span className="badge badge-success">In Stock</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Purchase history */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Purchase History</h3>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Purchase #</th><th>Date</th><th>Supplier</th><th>Items</th><th>Status</th><th className="text-right">Total</th></tr></thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-6 text-gray-400">No purchases yet</td></tr>
                ) : purchases.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono text-xs">{p.purchaseNumber}</td>
                    <td>{formatDate(p.createdAt)}</td>
                    <td>{p.supplier?.name || '–'}</td>
                    <td>{p.items?.length} item(s)</td>
                    <td><span className="badge badge-success capitalize">{p.status}</span></td>
                    <td className="text-right font-bold">{formatCurrency(p.total, symbol)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New purchase modal */}
      <Modal isOpen={open} onClose={() => setOpen(false)} title="New Purchase" size="xl">
        <form onSubmit={handlePurchase} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Supplier</label>
              <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="input">
                <option value="">Select supplier</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Notes</label>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
              <span className="col-span-5">Product</span>
              <span className="col-span-3">Qty</span>
              <span className="col-span-3">Cost Price</span>
            </div>
            {form.items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <select value={item.productId} onChange={(e) => updateItem(i, 'productId', e.target.value)} className="input col-span-5" required>
                  <option value="">Select product</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} className="input col-span-3" placeholder="Qty" required min="1" />
                <input type="number" value={item.costPrice} onChange={(e) => updateItem(i, 'costPrice', e.target.value)} className="input col-span-3" placeholder="Cost" required step="0.01" min="0" />
                <button type="button" onClick={() => setForm({ ...form, items: form.items.filter((_, j) => j !== i) })} className="col-span-1 text-red-400 hover:text-red-600 text-lg">✕</button>
              </div>
            ))}
          </div>

          <button type="button" onClick={addItem} className="btn btn-secondary btn-sm">+ Add Item</button>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <p className="font-bold text-lg">Total: {formatCurrency(total, symbol)}</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Saving...' : 'Record Purchase'}</button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Adjust stock modal */}
      <Modal isOpen={adjustOpen} onClose={() => setAdjustOpen(false)} title="Adjust Stock" size="sm">
        <form onSubmit={handleAdjust} className="space-y-4">
          <div className="form-group">
            <label className="label">Product *</label>
            <select value={adjustForm.productId} onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })} className="input" required>
              <option value="">Select product</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Type</label>
            <select value={adjustForm.type} onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })} className="input">
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
              <option value="adjustment">Direct Adjustment</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Quantity *</label>
            <input type="number" value={adjustForm.quantity} onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })} className="input" required min="1" />
          </div>
          <div className="form-group">
            <label className="label">Reason</label>
            <input value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} className="input" placeholder="e.g. damaged, expired" />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setAdjustOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Saving...' : 'Adjust'}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}

InventoryPage.getLayout = (page) => page;
