import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { formatCurrency, formatDate } from '@/lib/utils';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import toast from 'react-hot-toast';

const PRESETS = [
  { label: 'Today', start: format(new Date(), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') },
  { label: 'Yesterday', start: format(subDays(new Date(), 1), 'yyyy-MM-dd'), end: format(subDays(new Date(), 1), 'yyyy-MM-dd') },
  { label: 'Last 7 Days', start: format(subDays(new Date(), 6), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') },
  { label: 'This Month', start: format(startOfMonth(new Date()), 'yyyy-MM-dd'), end: format(endOfMonth(new Date()), 'yyyy-MM-dd') },
];

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [data, setData] = useState(null);
  const [profit, setProfit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sales');
  const [settings, setSettings] = useState({});

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then((d) => setSettings(d.settings || {}));
    fetchReports();
  }, []);

  const symbol = settings?.currency_symbol || 'PKR ';

  async function fetchReports() {
    setLoading(true);
    try {
      const [sr, pr] = await Promise.all([
        fetch(`/api/reports/sales?startDate=${startDate}&endDate=${endDate}`).then((r) => r.json()),
        fetch(`/api/reports/profit?startDate=${startDate}&endDate=${endDate}`).then((r) => r.json()),
      ]);
      setData(sr);
      setProfit(pr);
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }

  async function exportExcel() {
    const XLSX = (await import('xlsx')).default;
    const rows = data?.transactions?.map((t) => ({
      Invoice: t.saleNumber,
      Date: formatDate(t.createdAt, 'yyyy-MM-dd HH:mm'),
      Customer: t.customer?.name || 'Walk-in',
      Cashier: t.user?.name,
      Payment: t.paymentMethod,
      Status: t.status,
      Total: parseFloat(t.total),
    }));
    const ws = XLSX.utils.json_to_sheet(rows || []);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    XLSX.writeFile(wb, `sales-report-${startDate}-${endDate}.xlsx`);
  }

  async function exportPDF() {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Sales Report', 14, 22);
    doc.setFontSize(10);
    doc.text(`Period: ${startDate} to ${endDate}`, 14, 30);
    autoTable(doc, {
      startY: 38,
      head: [['Invoice', 'Date', 'Customer', 'Payment', 'Total']],
      body: (data?.transactions || []).map((t) => [
        t.saleNumber,
        formatDate(t.createdAt, 'yyyy-MM-dd'),
        t.customer?.name || 'Walk-in',
        t.paymentMethod,
        `${symbol}${parseFloat(t.total).toFixed(2)}`,
      ]),
    });
    doc.save(`sales-report-${startDate}.pdf`);
  }

  return (
    <Layout>
      <div className="space-y-5">
        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="label">From</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input w-40" />
            </div>
            <div>
              <label className="label">To</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input w-40" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { setStartDate(p.start); setEndDate(p.end); }}
                  className="btn btn-secondary btn-sm"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button onClick={fetchReports} disabled={loading} className="btn btn-primary">
              {loading ? 'Loading...' : 'Generate'}
            </button>
            <button onClick={exportPDF} className="btn btn-outline btn-sm">PDF</button>
            <button onClick={exportExcel} className="btn btn-outline btn-sm">Excel</button>
          </div>
        </div>

        {/* Summary */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: formatCurrency(data.summary?.revenue, symbol), color: 'text-blue-600' },
              { label: 'Transactions', value: data.summary?.transactions, color: 'text-gray-800' },
              { label: 'Discount Given', value: formatCurrency(data.summary?.discount, symbol), color: 'text-orange-600' },
              { label: 'Net Profit', value: formatCurrency(profit?.netProfit, symbol), color: profit?.netProfit >= 0 ? 'text-green-600' : 'text-red-600' },
            ].map((s) => (
              <div key={s.label} className="card p-4">
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="card overflow-hidden">
          <div className="flex border-b border-gray-200">
            {['sales', 'products', 'categories', 'payment', 'profit'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === 'sales' && (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Cashier</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!data?.transactions?.length ? (
                      <tr><td colSpan={7} className="text-center py-8 text-gray-400">No transactions found</td></tr>
                    ) : (
                      data.transactions.map((t) => (
                        <tr key={t.id}>
                          <td className="font-mono text-xs">{t.saleNumber}</td>
                          <td>{formatDate(t.createdAt, 'dd MMM, HH:mm')}</td>
                          <td>{t.customer?.name || 'Walk-in'}</td>
                          <td>{t.user?.name}</td>
                          <td><span className="badge badge-info capitalize">{t.paymentMethod}</span></td>
                          <td>
                            <span className={`badge ${t.status === 'completed' ? 'badge-success' : 'badge-danger'}`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="text-right font-semibold">{formatCurrency(t.total, symbol)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Product</th><th className="text-right">Qty Sold</th><th className="text-right">Revenue</th></tr></thead>
                  <tbody>
                    {!data?.topProducts?.length ? (
                      <tr><td colSpan={3} className="text-center py-8 text-gray-400">No data</td></tr>
                    ) : (
                      data.topProducts.map((p) => (
                        <tr key={p.productId}>
                          <td>{p.productName}</td>
                          <td className="text-right">{p._sum.quantity}</td>
                          <td className="text-right font-semibold">{formatCurrency(p._sum.total, symbol)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Category</th><th className="text-right">Qty</th><th className="text-right">Revenue</th></tr></thead>
                  <tbody>
                    {!data?.categoryWise?.length ? (
                      <tr><td colSpan={3} className="text-center py-8 text-gray-400">No data</td></tr>
                    ) : (
                      data.categoryWise.map((c) => (
                        <tr key={c.name}>
                          <td>{c.name}</td>
                          <td className="text-right">{c.quantity}</td>
                          <td className="text-right font-semibold">{formatCurrency(c.total, symbol)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Method</th><th className="text-right">Transactions</th><th className="text-right">Amount</th></tr></thead>
                  <tbody>
                    {data?.byPaymentMethod?.map((m) => (
                      <tr key={m.paymentMethod}>
                        <td className="capitalize">{m.paymentMethod}</td>
                        <td className="text-right">{m._count.id}</td>
                        <td className="text-right font-semibold">{formatCurrency(m._sum.total, symbol)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'profit' && profit && (
              <div className="max-w-sm space-y-3">
                {[
                  { label: 'Revenue', value: profit.revenue, color: 'text-blue-700' },
                  { label: 'Cost of Goods (COGS)', value: profit.cogs, color: 'text-gray-700' },
                  { label: 'Gross Profit', value: profit.grossProfit, color: 'text-green-700' },
                  { label: 'Gross Margin', value: `${profit.grossMargin}%`, color: 'text-green-600', noFormat: true },
                  { label: 'Expenses', value: profit.expenses, color: 'text-red-600' },
                  { label: 'Net Profit', value: profit.netProfit, color: profit.netProfit >= 0 ? 'text-green-700' : 'text-red-700' },
                  { label: 'Net Margin', value: `${profit.netMargin}%`, color: profit.netMargin >= 0 ? 'text-green-600' : 'text-red-600', noFormat: true },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">{row.label}</span>
                    <span className={`font-bold ${row.color}`}>
                      {row.noFormat ? row.value : formatCurrency(row.value, symbol)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

ReportsPage.getLayout = (page) => page;
