import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Modal from '@/components/ui/Modal';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function PaymentsPage() {
  const [creditCustomers, setCreditCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customerId: '', amount: '', paymentMethod: 'cash', notes: '' });
  const [loading, setLoading] = useState(false);
  const [symbol, setSymbol] = useState('PKR ');

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then((d) => setSymbol(d.settings?.currency_symbol || 'PKR '));
    fetchData();
  }, []);

  async function fetchData() {
    const res = await fetch('/api/payments');
    const data = await res.json();
    setCreditCustomers(data.creditCustomers || []);
    setPayments(data.payments || []);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Payment recorded');
      setOpen(false);
      setForm({ customerId: '', amount: '', paymentMethod: 'cash', notes: '' });
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="space-y-5">
        {/* Outstanding balances */}
        {creditCustomers.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Outstanding Balances</h3>
              <button onClick={() => setOpen(true)} className="btn btn-primary btn-sm">+ Receive Payment</button>
            </div>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Customer</th><th>Phone</th><th className="text-right">Balance Owed</th><th>Actions</th></tr></thead>
                <tbody>
                  {creditCustomers.map((c) => (
                    <tr key={c.id}>
                      <td className="font-medium">{c.name}</td>
                      <td>{c.phone || '–'}</td>
                      <td className="text-right font-bold text-red-600">{formatCurrency(c.creditBalance, symbol)}</td>
                      <td>
                        <button
                          onClick={() => { setForm({ customerId: String(c.id), amount: String(c.creditBalance), paymentMethod: 'cash', notes: '' }); setOpen(true); }}
                          className="btn btn-success btn-sm"
                        >
                          Pay
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment history */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Payment History</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Customer</th><th>Method</th><th>By</th><th>Notes</th><th className="text-right">Amount</th></tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">No payments recorded</td></tr>
                ) : payments.map((p) => (
                  <tr key={p.id}>
                    <td>{formatDateTime(p.createdAt)}</td>
                    <td>{p.customer?.name}</td>
                    <td className="capitalize">{p.paymentMethod}</td>
                    <td>{p.user?.name}</td>
                    <td className="text-xs text-gray-500">{p.notes}</td>
                    <td className="text-right font-bold text-green-600">{formatCurrency(p.amount, symbol)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment modal */}
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Receive Payment">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="label">Customer *</label>
            <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="input" required>
              <option value="">Select customer</option>
              {creditCustomers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — Owes {formatCurrency(c.creditBalance, symbol)}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Amount *</label>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input" required min="0.01" step="0.01" />
          </div>
          <div className="form-group">
            <label className="label">Payment Method</label>
            <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="input">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="online">Online</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Notes</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-success">
              {loading ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}

PaymentsPage.getLayout = (page) => page;
