import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

const EMPTY = { name: '', description: '' };

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchCats(); }, []);

  async function fetchCats() {
    const res = await fetch('/api/categories?all=1');
    const data = await res.json();
    setCategories(data.categories || []);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editId ? `/api/categories/${editId}` : '/api/categories';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editId ? 'Category updated' : 'Category added');
      setOpen(false); setForm(EMPTY); setEditId(null);
      fetchCats();
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  }

  async function handleDelete() {
    await fetch(`/api/categories/${deleteId}`, { method: 'DELETE' });
    toast.success('Category removed');
    setDeleteId(null);
    fetchCats();
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex justify-end">
          <button onClick={() => { setForm(EMPTY); setEditId(null); setOpen(true); }} className="btn btn-primary">+ Add Category</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{c.name}</h3>
                  {c.description && <p className="text-sm text-gray-500 mt-1">{c.description}</p>}
                  <p className="text-xs text-gray-400 mt-2">{c._count?.products || 0} products</p>
                </div>
                <span className={`badge ${c.active ? 'badge-success' : 'badge-gray'} ml-2`}>
                  {c.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => { setForm({ name: c.name, description: c.description || '' }); setEditId(c.id); setOpen(true); }}
                  className="btn btn-secondary btn-sm flex-1"
                >
                  Edit
                </button>
                <button onClick={() => setDeleteId(c.id)} className="btn btn-danger btn-sm">Del</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={editId ? 'Edit Category' : 'Add Category'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="label">Category Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" rows={3} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Saving...' : editId ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Category" message="Delete this category? Products won't be deleted." />
    </Layout>
  );
}

CategoriesPage.getLayout = (page) => page;
