import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { format } from 'date-fns';

export default function LedgerPage() {
  const [ledger, setLedger] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [symbol, setSymbol] = useState('PKR ');

  useEffect(() => {
    fetch('/api/customers').then((r) => r.json()).then((d) => setCustomers(d.customers || []));
    fetch('/api/settings').then((r) => r.json()).then((d) => setSymbol(d.settings?.currency_symbol || 'PKR '));
    fetchLedger();
  }, []);

  async function fetchLedger() {
    setLoading(true);
    const params = new URLSearchParams();
    if (customerId) params.set('customerId', customerId);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const res = await fetch(`/api/ledger?${params}`);
    const data = await res.json();
    setLedger(data.ledger || []);
    setLoading(false);
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="card p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">Customer</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="input w-48">
              <option value="">All Customers</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input w-36" />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input w-36" />
          </div>
          <button onClick={fetchLedger} className="btn btn-primary">Filter</button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Reference</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Balance</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : ledger.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No ledger entries found</td></tr>
              ) : (
                ledger.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDateTime(entry.createdAt)}</td>
                    <td className="font-medium">{entry.customer?.name}</td>
                    <td>
                      <span className={`badge ${entry.type === 'debit' ? 'badge-danger' : 'badge-success'}`}>
                        {entry.type}
                      </span>
                    </td>
                    <td className="text-xs text-gray-500">{entry.referenceType} #{entry.referenceId}</td>
                    <td className={`text-right font-semibold ${entry.type === 'debit' ? 'text-red-600' : 'text-green-600'}`}>
                      {entry.type === 'debit' ? '-' : '+'}{formatCurrency(entry.amount, symbol)}
                    </td>
                    <td className="text-right font-bold">{formatCurrency(entry.balance, symbol)}</td>
                    <td className="text-xs text-gray-500">{entry.notes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

LedgerPage.getLayout = (page) => page;
