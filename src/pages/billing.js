import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import ProductGrid from '@/components/billing/ProductGrid';
import Cart from '@/components/billing/Cart';
import PaymentModal from '@/components/billing/PaymentModal';
import Receipt from '@/components/billing/Receipt';
import HeldBillsModal from '@/components/billing/HeldBillsModal';
import TableSelectModal from '@/components/billing/TableSelectModal';
import TableOrderModal from '@/components/billing/TableOrderModal';
import { useCart } from '@/context/CartContext';
import { useReactToPrint } from 'react-to-print';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';


export default function BillingPage() {
  const [products, setProducts]               = useState([]);
  const [categories, setCategories]           = useState([]);
  const [customers, setCustomers]             = useState([]);
  const [settings, setSettings]               = useState({});
  const [search, setSearch]                   = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [paymentOpen, setPaymentOpen]         = useState(false);
  const [heldOpen, setHeldOpen]               = useState(false);
  const [completedSale, setCompletedSale]     = useState(null);
  const [receiptOpen, setReceiptOpen]         = useState(false);
  const [orderType, setOrderType]             = useState('dine_in');
  const [selectedTable, setSelectedTable]     = useState(null);
  const [tableSelectOpen, setTableSelectOpen] = useState(false);
  const [runningOrder, setRunningOrder]       = useState(null); // active TableOrder for selected table
  const [savingOrder, setSavingOrder]         = useState(false);
  const [tableOrderModalOpen, setTableOrderModalOpen] = useState(false);

  const { items, customer, discount, clearCart, loadItems } = useCart();
  const receiptRef = useRef();

  const symbol  = settings?.currency_symbol || 'PKR ';
  const taxRate = settings?.tax_enabled === 'true' ? parseFloat(settings?.tax_rate || 0) : 0;

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: completedSale ? `Receipt-${completedSale.saleNumber}` : 'Receipt',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/products?active=true&limit=200').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/customers').then((r) => r.json()),
      fetch('/api/settings').then((r) => r.json()),
    ]).then(([p, c, cu, s]) => {
      setProducts(p.products || []);
      setFilteredProducts(p.products || []);
      setCategories(c.categories || []);
      setCustomers(cu.customers || []);
      setSettings(s.settings || {});
    });
  }, []);

  useEffect(() => {
    if (!search) { setFilteredProducts(products); return; }
    const q = search.toLowerCase();
    setFilteredProducts(
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      )
    );
  }, [search, products]);

  async function handleHold() {
    if (items.length === 0) return toast.error('Cart is empty');
    try {
      await fetch('/api/sales/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customerId: customer?.id,
          customerName: customer?.name,
          discount,
          notes: '',
        }),
      });
      clearCart();
      toast.success('Bill held');
    } catch {
      toast.error('Failed to hold bill');
    }
  }

  async function freeTable(table) {
    if (!table) return;
    await fetch(`/api/tables/${table.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'free' }),
    });
  }

  async function handleTableSelect(table) {
    if (table) {
      const existingOrder = table.tableOrders?.[0] || null;
      if (existingOrder) {
        // Table has a running/billed order — load its items into the cart
        try {
          const orderItems = JSON.parse(existingOrder.itemsJson || '[]');
          loadItems(orderItems, existingOrder.discount || 0);
        } catch {
          clearCart();
        }
        setRunningOrder(existingOrder);
      } else {
        // Free table — clear cart and mark as occupied
        clearCart();
        await fetch(`/api/tables/${table.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'occupied' }),
        });
        setRunningOrder(null);
      }
    } else {
      // Clearing selection — only free if WE set it occupied (no existing order)
      if (selectedTable && !runningOrder) {
        await freeTable(selectedTable);
      }
      clearCart();
      setRunningOrder(null);
    }
    setSelectedTable(table);
    setTableSelectOpen(false);
  }

  async function handleSaveOrder() {
    if (items.length === 0) { toast.error('Cart is empty'); return; }
    if (!selectedTable) { toast.error('Select a table first'); return; }

    setSavingOrder(true);
    try {
      if (runningOrder) {
        // Cart already has the full order (existing + any new items) — save as-is
        const res = await fetch(`/api/tables/orders/${runningOrder.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items, discount, status: 'running' }),
        });
        if (!res.ok) throw new Error('Failed to update order');
        setRunningOrder({ ...runningOrder, itemsJson: JSON.stringify(items), discount });
        toast.success(`Order updated — Table ${selectedTable.number}`);
      } else {
        // Create new running order
        const res = await fetch('/api/tables/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableId: selectedTable.id,
            items,
            customerId: customer?.id || null,
            customerName: customer?.name || null,
            discount,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save order');
        setRunningOrder(data.order);
        toast.success(`Order saved — Table ${selectedTable.number}`);
      }
      clearCart();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingOrder(false);
    }
  }

  function handleSaleSuccess(sale) {
    freeTable(selectedTable);
    setSelectedTable(null);
    setRunningOrder(null);
    setCompletedSale(sale);
    setPaymentOpen(false);
    setTableOrderModalOpen(false);
    setReceiptOpen(true);
    clearCart();
  }

  function handleNewSale() {
    setReceiptOpen(false);
    setCompletedSale(null);
  }

  const showSaveOrder = orderType === 'dine_in' && selectedTable && items.length > 0;

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-80px)]">
        {/* Left: product area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Toolbar */}
          <div className="flex gap-2 mb-3">
            {/* Dine In / Take Away toggle */}
            <div className="flex rounded-xl border border-gray-200 overflow-hidden flex-shrink-0">
              <button
                onClick={() => setOrderType('dine_in')}
                className={`px-4 py-2 text-sm font-semibold transition-colors ${
                  orderType === 'dine_in'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                🍽️ Dine In
              </button>
              <button
                onClick={async () => {
                  if (selectedTable && !runningOrder) {
                    await freeTable(selectedTable);
                  }
                  setSelectedTable(null);
                  setRunningOrder(null);
                  setOrderType('takeaway');
                }}
                className={`px-4 py-2 text-sm font-semibold transition-colors border-l border-gray-200 ${
                  orderType === 'takeaway'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                🥡 Take Away
              </button>
            </div>

            {/* Table selector (Dine In only) */}
            {orderType === 'dine_in' && (
              <button
                onClick={() => setTableSelectOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-colors flex-shrink-0 ${
                  selectedTable
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                🪑 {selectedTable ? `Table ${selectedTable.number}` : 'Select Table'}
              </button>
            )}

            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search by name or scan barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
                autoFocus
              />
            </div>
            <button
              onClick={() => setHeldOpen(true)}
              className="btn btn-secondary whitespace-nowrap"
            >
              📋 Held
            </button>
          </div>

          {/* Running order banner */}
          {runningOrder && orderType === 'dine_in' && (
            <div className="mb-3 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-sm">
              <span className="text-amber-500 text-base">📋</span>
              <span className="text-amber-800 font-medium flex-1">
                Editing order for Table {selectedTable?.number}
                {' '}— modify items in cart then click <strong>Update Order</strong> to save.
              </span>
              <button
                onClick={() => setTableOrderModalOpen(true)}
                className="flex-shrink-0 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
              >
                Open Order →
              </button>
            </div>
          )}

          {/* Products */}
          <div className="flex-1 min-h-0">
            <ProductGrid
              products={filteredProducts}
              categories={categories}
              symbol={symbol}
            />
          </div>
        </div>

        {/* Right: cart */}
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 flex flex-col min-h-0 lg:h-full">
          {/* Save / Update Order button for dine-in */}
          {showSaveOrder && (
            <button
              onClick={handleSaveOrder}
              disabled={savingOrder}
              className="btn btn-primary mb-2 w-full flex items-center justify-center gap-2"
            >
              {savingOrder
                ? 'Saving...'
                : runningOrder
                ? `📋 Update Order — Table ${selectedTable.number}`
                : `💾 Save Order — Table ${selectedTable.number}`}
            </button>
          )}
          <Cart
            onCheckout={() => setPaymentOpen(true)}
            onHold={handleHold}
            symbol={symbol}
          />
        </div>
      </div>

      {/* Payment modal (for direct quick checkout) */}
      <PaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSuccess={handleSaleSuccess}
        customers={customers}
        taxRate={taxRate}
        symbol={symbol}
        orderType={orderType}
        tableId={selectedTable?.id || null}
      />

      {/* Held bills */}
      <HeldBillsModal isOpen={heldOpen} onClose={() => setHeldOpen(false)} symbol={symbol} />

      {/* Table select modal */}
      <TableSelectModal
        isOpen={tableSelectOpen}
        onClose={() => setTableSelectOpen(false)}
        onSelect={handleTableSelect}
        selectedTableId={selectedTable?.id}
      />

      {/* Table order modal — manage/checkout running table order from billing page */}
      {runningOrder && (
        <TableOrderModal
          isOpen={tableOrderModalOpen}
          onClose={() => setTableOrderModalOpen(false)}
          table={selectedTable}
          order={runningOrder}
          onPaid={handleSaleSuccess}
          symbol={symbol}
          taxRate={taxRate}
          settings={settings}
        />
      )}

      {/* Receipt modal */}
      <Modal
        isOpen={receiptOpen}
        onClose={handleNewSale}
        title="Sale Complete"
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
          <button onClick={handleNewSale} className="btn btn-primary flex-1">
            New Sale
          </button>
        </div>
      </Modal>
    </Layout>
  );
}

BillingPage.getLayout = (page) => page;
