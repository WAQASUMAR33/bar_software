import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const EMPTY = { name: '', phone: '', email: '', address: '', creditLimit: '0' };

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchCustomers(); }, []);

  async function fetchCustomers() {
    const res = await fetch(`/api/customers${search ? `?search=${search}` : ''}`);
    const data = await res.json();
    setCustomers(data.customers || []);
  }

  useEffect(() => {
    const t = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editId ? `/api/customers/${editId}` : '/api/customers';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editId ? 'Customer updated' : 'Customer added');
      setOpen(false);
      setForm(EMPTY);
      setEditId(null);
      fetchCustomers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    try {
      await fetch(`/api/customers/${deleteId}`, { method: 'DELETE' });
      toast.success('Customer removed');
      setDeleteId(null);
      fetchCustomers();
    } catch {
      toast.error('Failed to delete');
    }
  }

  function openEdit(c) {
    setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', creditLimit: String(c.creditLimit) });
    setEditId(c.id);
    setOpen(true);
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-64"
          />
          <button onClick={() => { setForm(EMPTY); setEditId(null); setOpen(true); }} className="btn btn-primary">
            + Add Customer
          </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Credit Limit</th>
                <th>Balance Owed</th>
                <th>Points</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No customers found</td></tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium">{c.name}</td>
                    <td>{c.phone || '–'}</td>
                    <td>{c.email || '–'}</td>
                    <td>{formatCurrency(c.creditLimit)}</td>
                    <td>
                      <span className={parseFloat(c.creditBalance) > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}>
                        {formatCurrency(c.creditBalance)}
                      </span>
                    </td>
                    <td>{c.loyaltyPoints}</td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(c)} className="btn btn-secondary btn-sm">Edit</button>
                        <button onClick={() => setDeleteId(c.id)} className="btn btn-danger btn-sm">Del</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit modal */}
      <Modal isOpen={open} onClose={() => setOpen(false)} title={editId ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group col-span-2">
              <label className="label">Full Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
            </div>
            <div className="form-group">
              <label className="label">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
            </div>
            <div className="form-group col-span-2">
              <label className="label">Address</label>
              <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input" rows={2} />
            </div>
            <div className="form-group">
              <label className="label">Credit Limit</label>
              <input type="number" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} className="input" min="0" />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : editId ? 'Update' : 'Add Customer'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message="Are you sure you want to delete this customer?"
      />
    </Layout>
  );
}

CustomersPage.getLayout = (page) => page;
