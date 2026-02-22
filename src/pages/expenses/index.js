import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatCurrency, formatDate } from '@/lib/utils';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const EMPTY = { categoryId: '', amount: '', description: '', expenseDate: format(new Date(), 'yyyy-MM-dd') };

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ startDate: format(new Date(), 'yyyy-MM-dd'), endDate: format(new Date(), 'yyyy-MM-dd') });
  const [symbol, setSymbol] = useState('PKR ');

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then((d) => setSymbol(d.settings?.currency_symbol || 'PKR '));
    fetch('/api/expenses/categories').then((r) => r.json()).then((d) => setCategories(d.categories || []));
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    const params = new URLSearchParams(filter);
    const res = await fetch(`/api/expenses?${params}`);
    const data = await res.json();
    setExpenses(data.expenses || []);
    setTotal(data.totalAmount || 0);
  }

  useEffect(() => { fetchExpenses(); }, [filter]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Expense added');
      setOpen(false); setForm(EMPTY); fetchExpenses();
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  }

  async function handleDelete() {
    await fetch(`/api/expenses?id=${deleteId}`, { method: 'DELETE' });
    toast.success('Expense deleted');
    setDeleteId(null);
    fetchExpenses();
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="card p-4 flex flex-wrap gap-3 items-end justify-between">
          <div className="flex gap-3">
            <div>
              <label className="label">From</label>
              <input type="date" value={filter.startDate} onChange={(e) => setFilter({ ...filter, startDate: e.target.value })} className="input w-36" />
            </div>
            <div>
              <label className="label">To</label>
              <input type="date" value={filter.endDate} onChange={(e) => setFilter({ ...filter, endDate: e.target.value })} className="input w-36" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500">Total Expenses</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(total, symbol)}</p>
            </div>
            <button onClick={() => setOpen(true)} className="btn btn-primary">+ Add Expense</button>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Added By</th>
                <th className="text-right">Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No expenses found</td></tr>
              ) : expenses.map((e) => (
                <tr key={e.id}>
                  <td>{formatDate(e.expenseDate)}</td>
                  <td>{e.category?.name || '–'}</td>
                  <td>{e.description || '–'}</td>
                  <td>{e.user?.name}</td>
                  <td className="text-right font-semibold text-red-600">{formatCurrency(e.amount, symbol)}</td>
                  <td>
                    <button onClick={() => setDeleteId(e.id)} className="btn btn-danger btn-sm">Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add Expense" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="label">Category</label>
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input">
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Amount *</label>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input" required step="0.01" min="0.01" />
          </div>
          <div className="form-group">
            <label className="label">Date *</label>
            <input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} className="input" required />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" rows={2} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Saving...' : 'Add Expense'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Expense" message="Delete this expense record?" />
    </Layout>
  );
}

ExpensesPage.getLayout = (page) => page;
