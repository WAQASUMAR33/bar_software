import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

const EMPTY = { name: '', categoryId: '', price: '', costPrice: '', stock: '0', barcode: '', description: '', trackQuantity: false };

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [symbol, setSymbol] = useState('PKR ');

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then((d) => setSymbol(d.settings?.currency_symbol || 'PKR '));
    fetchCategories();
    fetchProducts();
  }, []);

  async function fetchCategories() {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data.categories || []);
  }

  async function fetchProducts() {
    const params = new URLSearchParams({ limit: '500' });
    if (search) params.set('search', search);
    if (filterCat) params.set('categoryId', filterCat);
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products || []);
  }

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [search, filterCat]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editId ? `/api/products/${editId}` : '/api/products';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, categoryId: form.categoryId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editId ? 'Product updated' : 'Product added');
      setOpen(false);
      setForm(EMPTY);
      setEditId(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    try {
      await fetch(`/api/products/${deleteId}`, { method: 'DELETE' });
      toast.success('Product removed');
      setDeleteId(null);
      fetchProducts();
    } catch { toast.error('Failed to delete'); }
  }

  function openEdit(p) {
    setForm({
      name: p.name, categoryId: p.categoryId ? String(p.categoryId) : '',
      price: String(p.price), costPrice: String(p.costPrice),
      stock: String(p.stock), barcode: p.barcode || '', description: p.description || '',
      trackQuantity: p.trackQuantity !== false,
    });
    setEditId(p.id);
    setOpen(true);
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-3">
            <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="input w-52" />
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="input w-44">
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button onClick={() => { setForm(EMPTY); setEditId(null); setOpen(true); }} className="btn btn-primary">+ Add Product</button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Barcode</th>
                <th className="text-right">Price</th>
                <th className="text-right">Cost</th>
                <th className="text-right">Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No products found</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        {p.description && <p className="text-xs text-gray-400 truncate max-w-xs">{p.description}</p>}
                      </div>
                    </td>
                    <td>{p.category?.name || '–'}</td>
                    <td className="font-mono text-xs">{p.barcode || '–'}</td>
                    <td className="text-right font-semibold text-blue-600">{formatCurrency(p.price, symbol)}</td>
                    <td className="text-right text-gray-500">{formatCurrency(p.costPrice, symbol)}</td>
                    <td className="text-right">
                      {p.trackQuantity === false ? (
                        <span className="text-xs text-gray-400 italic">Not tracked</span>
                      ) : (
                        <span className={`font-semibold ${p.stock <= 10 ? 'text-orange-500' : 'text-gray-700'} ${p.stock === 0 ? 'text-red-600' : ''}`}>
                          {p.stock}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${p.active ? 'badge-success' : 'badge-gray'}`}>
                        {p.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="btn btn-secondary btn-sm">Edit</button>
                        <button onClick={() => setDeleteId(p.id)} className="btn btn-danger btn-sm">Del</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={editId ? 'Edit Product' : 'Add Product'} size="lg">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="form-group col-span-2">
            <label className="label">Product Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
          </div>
          <div className="form-group">
            <label className="label">Category</label>
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input">
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Barcode</label>
            <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="input" placeholder="Scan or enter" />
          </div>
          <div className="form-group">
            <label className="label">Selling Price *</label>
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" required step="0.01" min="0" />
          </div>
          <div className="form-group">
            <label className="label">Cost Price *</label>
            <input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} className="input" required step="0.01" min="0" />
          </div>
          <div className="form-group">
            <label className="label">Stock Quantity</label>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="input"
              min="0"
              disabled={!form.trackQuantity}
            />
          </div>
          <div className="form-group flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id="trackQuantity"
              checked={form.trackQuantity}
              onChange={(e) => setForm({ ...form, trackQuantity: e.target.checked })}
              className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
            />
            <label htmlFor="trackQuantity" className="label mb-0 cursor-pointer select-none">
              Track stock quantity
            </label>
          </div>
          <div className="form-group col-span-2">
            <label className="label">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" rows={2} />
          </div>
          <div className="col-span-2 flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : editId ? 'Update' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure? This will deactivate the product."
      />
    </Layout>
  );
}

ProductsPage.getLayout = (page) => page;
