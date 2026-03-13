import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import Modal from '@/components/ui/Modal';
import TableOrderModal from '@/components/billing/TableOrderModal';
import Receipt from '@/components/billing/Receipt';
import { useAuth } from '@/context/AuthContext';
import { useReactToPrint } from 'react-to-print';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function TablesPage() {
  const { user } = useAuth();
  const canManage = user && ['admin', 'manager'].includes(user.role);

  const [tables, setTables]           = useState([]);
  const [settings, setSettings]       = useState({});
  const [loading, setLoading]         = useState(true);
  const [addOpen, setAddOpen]         = useState(false);
  const [editTable, setEditTable]     = useState(null);
  const [deleteTable, setDeleteTable] = useState(null);
  const [saving, setSaving]           = useState(false);

  // Order modal state
  const [orderModalData, setOrderModalData] = useState(null); // { table, order }

  // Receipt state (after payment)
  const [completedSale, setCompletedSale] = useState(null);
  const [receiptOpen, setReceiptOpen]     = useState(false);
  const receiptRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: completedSale ? `Receipt-${completedSale.saleNumber}` : 'Receipt',
  });

  const emptyForm = { number: '', name: '', capacity: 4, floor: '' };
  const [form, setForm] = useState(emptyForm);

  const symbol  = settings?.currency_symbol || 'PKR ';
  const taxRate = settings?.tax_enabled === 'true' ? parseFloat(settings?.tax_rate || 0) : 0;

  async function loadTables() {
    setLoading(true);
    try {
      const [tablesRes, settingsRes] = await Promise.all([
        fetch('/api/tables').then((r) => r.json()),
        fetch('/api/settings').then((r) => r.json()),
      ]);
      setTables(tablesRes.tables || []);
      setSettings(settingsRes.settings || {});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTables(); }, []);

  function openAdd() {
    setForm(emptyForm);
    setAddOpen(true);
  }

  function openEdit(table) {
    setForm({
      number: table.number,
      name: table.name || '',
      capacity: table.capacity,
      floor: table.floor || '',
    });
    setEditTable(table);
  }

  async function handleSave() {
    if (!form.number) return toast.error('Table number is required');
    setSaving(true);
    try {
      let res;
      if (editTable) {
        res = await fetch(`/api/tables/${editTable.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name || null,
            capacity: parseInt(form.capacity),
            floor: form.floor || null,
          }),
        });
      } else {
        res = await fetch('/api/tables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            number: parseInt(form.number),
            name: form.name || null,
            capacity: parseInt(form.capacity),
            floor: form.floor || null,
          }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      toast.success(editTable ? 'Table updated' : 'Table added');
      setAddOpen(false);
      setEditTable(null);
      loadTables();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTable) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tables/${deleteTable.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      toast.success('Table removed');
      setDeleteTable(null);
      loadTables();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(table) {
    if (!canManage) return;
    const newStatus = table.status === 'free' ? 'occupied' : 'free';
    try {
      await fetch(`/api/tables/${table.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      loadTables();
    } catch {
      toast.error('Failed to update status');
    }
  }

  function openOrderModal(table) {
    const order = table.tableOrders?.[0] || null;
    if (!order) { toast.error('No running order found for this table'); return; }
    setOrderModalData({ table, order });
  }

  function handleOrderPaid(sale) {
    setOrderModalData(null);
    setCompletedSale(sale);
    setReceiptOpen(true);
    loadTables();
  }

  const floors    = [...new Set(tables.map((t) => t.floor || 'Main Floor'))].sort();
  const freeCount = tables.filter((t) => t.status === 'free').length;
  const busyCount = tables.filter((t) => t.status !== 'free').length;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Table Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              {tables.length} tables &middot;{' '}
              <span className="text-green-600 font-medium">{freeCount} free</span>
              {' '}&middot;{' '}
              <span className="text-amber-600 font-medium">{busyCount} occupied</span>
            </p>
          </div>
          {canManage && (
            <button onClick={openAdd} className="btn btn-primary">
              + Add Table
            </button>
          )}
        </div>

        {/* Table grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Loading tables...</div>
        ) : tables.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="text-5xl mb-3">🪑</div>
            <p className="text-gray-500 font-medium">No tables yet</p>
            {canManage && (
              <button onClick={openAdd} className="btn btn-primary mt-4">
                Add your first table
              </button>
            )}
          </div>
        ) : (
          floors.map((floor) => (
            <div key={floor} className="mb-8">
              {floors.length > 1 && (
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {floor}
                </h2>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {tables
                  .filter((t) => (t.floor || 'Main Floor') === floor)
                  .map((table) => {
                    const isFree   = table.status === 'free';
                    const order    = table.tableOrders?.[0];
                    let orderItems = [];
                    let orderTotal = 0;
                    if (order) {
                      try {
                        orderItems = JSON.parse(order.itemsJson || '[]');
                        orderTotal = orderItems.reduce((s, i) => s + (i.total || 0), 0);
                      } catch {}
                    }

                    return (
                      <div
                        key={table.id}
                        className={`relative rounded-2xl border-2 p-4 transition-all ${
                          isFree
                            ? 'border-green-300 bg-green-50'
                            : 'border-amber-300 bg-amber-50'
                        }`}
                      >
                        <span
                          className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${
                            isFree ? 'bg-green-500' : 'bg-amber-500'
                          }`}
                        />

                        <div className="text-2xl font-bold text-gray-800 mb-0.5">
                          T{table.number}
                        </div>
                        {table.name && (
                          <div className="text-xs text-gray-500 truncate mb-1">{table.name}</div>
                        )}
                        <div className="text-xs text-gray-400">{table.capacity} seats</div>

                        {/* Running order summary */}
                        {order && (
                          <div className="mt-2 text-xs text-amber-700 bg-amber-100 rounded-lg px-2 py-1">
                            <span className="font-semibold">{orderItems.length} items</span>
                            {' · '}
                            <span>{formatCurrency(orderTotal, symbol)}</span>
                            {order.status === 'billed' && (
                              <span className="ml-1 font-bold text-blue-700"> [Billed]</span>
                            )}
                          </div>
                        )}

                        <div className="mt-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isFree
                                ? 'bg-green-200 text-green-800'
                                : 'bg-amber-200 text-amber-800'
                            }`}
                          >
                            {isFree ? 'Free' : 'Occupied'}
                          </span>
                        </div>

                        <div className="mt-3 space-y-1.5">
                          {/* Open Order button */}
                          {!isFree && order && (
                            <button
                              onClick={() => openOrderModal(table)}
                              className="w-full text-xs py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                            >
                              Open Order →
                            </button>
                          )}

                          {canManage && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleToggleStatus(table)}
                                className="flex-1 text-xs py-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium transition-colors"
                              >
                                {isFree ? 'Mark Busy' : 'Mark Free'}
                              </button>
                              <button
                                onClick={() => openEdit(table)}
                                className="px-2 py-1 rounded-lg bg-white border border-gray-200 hover:bg-blue-50 text-blue-600 text-xs transition-colors"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => setDeleteTable(table)}
                                className="px-2 py-1 rounded-lg bg-white border border-gray-200 hover:bg-red-50 text-red-500 text-xs transition-colors"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Table Order Modal (3-step flow) */}
      {orderModalData && (
        <TableOrderModal
          isOpen={!!orderModalData}
          onClose={() => setOrderModalData(null)}
          table={orderModalData.table}
          order={orderModalData.order}
          onPaid={handleOrderPaid}
          symbol={symbol}
          taxRate={taxRate}
          settings={settings}
        />
      )}

      {/* Receipt modal after table payment */}
      <Modal
        isOpen={receiptOpen}
        onClose={() => { setReceiptOpen(false); setCompletedSale(null); }}
        title="Payment Complete"
        size="sm"
      >
        <div className="text-center mb-4">
          <div className="text-5xl mb-2">✅</div>
          <p className="text-lg font-bold text-gray-800">Payment Successful!</p>
          <p className="text-sm text-gray-500">Invoice: {completedSale?.saleNumber}</p>
        </div>
        <div className="border border-dashed border-gray-300 rounded-xl overflow-hidden mb-4 max-h-80 overflow-y-auto">
          <Receipt ref={receiptRef} sale={completedSale} settings={settings} />
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="btn btn-outline flex-1">
            🖨️ Print Receipt
          </button>
          <button
            onClick={() => { setReceiptOpen(false); setCompletedSale(null); }}
            className="btn btn-primary flex-1"
          >
            Done
          </button>
        </div>
      </Modal>

      {/* Add / Edit modal */}
      <Modal
        isOpen={addOpen || !!editTable}
        onClose={() => { setAddOpen(false); setEditTable(null); }}
        title={editTable ? `Edit Table T${editTable.number}` : 'Add New Table'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Table Number <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={form.number}
              onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
              className="input"
              placeholder="e.g. 1"
              disabled={!!editTable}
            />
          </div>
          <div>
            <label className="label">Name / Label <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input"
              placeholder="e.g. Window Table"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Capacity (seats)</label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                className="input"
                min="1"
              />
            </div>
            <div>
              <label className="label">Floor / Section <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="text"
                value={form.floor}
                onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
                className="input"
                placeholder="e.g. Ground"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => { setAddOpen(false); setEditTable(null); }}
            className="btn btn-secondary flex-1"
          >
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary flex-1">
            {saving ? 'Saving...' : editTable ? 'Update' : 'Add Table'}
          </button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        isOpen={!!deleteTable}
        onClose={() => setDeleteTable(null)}
        title="Remove Table"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Remove <strong>Table {deleteTable?.number}</strong>
          {deleteTable?.name ? ` (${deleteTable.name})` : ''}? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteTable(null)} className="btn btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={saving} className="btn btn-danger flex-1">
            {saving ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </Modal>
    </Layout>
  );
}
