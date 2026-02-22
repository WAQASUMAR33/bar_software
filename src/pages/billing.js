import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import ProductGrid from '@/components/billing/ProductGrid';
import Cart from '@/components/billing/Cart';
import PaymentModal from '@/components/billing/PaymentModal';
import Receipt from '@/components/billing/Receipt';
import HeldBillsModal from '@/components/billing/HeldBillsModal';
import { useCart } from '@/context/CartContext';
import { useReactToPrint } from 'react-to-print';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';

export default function BillingPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [settings, setSettings] = useState({});
  const [search, setSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [heldOpen, setHeldOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const { items, customer, discount, clearCart } = useCart();
  const receiptRef = useRef();

  const symbol = settings?.currency_symbol || 'PKR ';

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

  // Product search
  useEffect(() => {
    if (!search) {
      setFilteredProducts(products);
      return;
    }
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

  function handleSaleSuccess(sale) {
    setCompletedSale(sale);
    setPaymentOpen(false);
    setReceiptOpen(true);
    clearCart();
  }

  function handleNewSale() {
    setReceiptOpen(false);
    setCompletedSale(null);
  }

  const taxRate = settings?.tax_enabled === 'true' ? parseFloat(settings?.tax_rate || 0) : 0;

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-80px)]">
        {/* Left: product area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search bar */}
          <div className="flex gap-2 mb-3">
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
              📋 Held ({/* count will show dynamically */})
            </button>
          </div>

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
          <Cart
            onCheckout={() => setPaymentOpen(true)}
            onHold={handleHold}
            symbol={symbol}
          />
        </div>
      </div>

      {/* Payment modal */}
      <PaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSuccess={handleSaleSuccess}
        customers={customers}
        taxRate={taxRate}
        symbol={symbol}
      />

      {/* Held bills */}
      <HeldBillsModal isOpen={heldOpen} onClose={() => setHeldOpen(false)} symbol={symbol} />

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

        {/* Receipt preview */}
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
