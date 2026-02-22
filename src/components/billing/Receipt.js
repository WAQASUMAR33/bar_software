import { forwardRef } from 'react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

const Receipt = forwardRef(function Receipt({ sale, settings = {} }, ref) {
  if (!sale) return null;

  const symbol = settings.currency_symbol || 'PKR ';

  return (
    <div ref={ref} className="receipt bg-white p-4 max-w-xs mx-auto text-xs">
      {/* Shop header */}
      <div className="text-center mb-4 border-b-2 border-dashed border-gray-300 pb-4">
        <img
          src="/logo.jpeg"
          alt="Logo"
          className="mx-auto mb-2"
          style={{ maxHeight: '64px', maxWidth: '160px', objectFit: 'contain' }}
        />
        <p className="text-base font-bold">{settings.shop_name || 'Holiday Ice Cream Bar'}</p>
        {settings.shop_address && <p className="text-gray-600">{settings.shop_address}</p>}
        {settings.shop_phone && <p className="text-gray-600">Tel: {settings.shop_phone}</p>}
        {settings.shop_email && <p className="text-gray-600">{settings.shop_email}</p>}
      </div>

      {/* Invoice info */}
      <div className="mb-3">
        <div className="flex justify-between">
          <span className="text-gray-500">Invoice#</span>
          <span className="font-bold">{sale.saleNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Date</span>
          <span>{formatDateTime(sale.createdAt)}</span>
        </div>
        {sale.customer && (
          <div className="flex justify-between">
            <span className="text-gray-500">Customer</span>
            <span>{sale.customer.name}</span>
          </div>
        )}
        {sale.user && (
          <div className="flex justify-between">
            <span className="text-gray-500">Cashier</span>
            <span>{sale.user.name}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="border-t-2 border-dashed border-gray-300 py-3 mb-3">
        <div className="flex justify-between font-bold mb-2 text-gray-700">
          <span>Item</span>
          <span>Amt</span>
        </div>
        {sale.items?.map((item, i) => (
          <div key={i} className="mb-1.5">
            <div className="flex justify-between">
              <span className="flex-1 pr-2">
                {item.productName}
                {item.variation ? ` (${item.variation})` : ''}
              </span>
              <span>{formatCurrency(item.total, symbol)}</span>
            </div>
            <div className="text-gray-400 pl-2">
              {item.quantity} × {formatCurrency(item.price, symbol)}
              {item.discount > 0 && ` - ${formatCurrency(item.discount, symbol)}`}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t-2 border-dashed border-gray-300 pt-3 mb-3 space-y-1">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(sale.subtotal, symbol)}</span>
        </div>
        {parseFloat(sale.discount) > 0 && (
          <div className="flex justify-between text-gray-500">
            <span>Discount</span>
            <span>-{formatCurrency(sale.discount, symbol)}</span>
          </div>
        )}
        {parseFloat(sale.tax) > 0 && (
          <div className="flex justify-between text-gray-500">
            <span>Tax</span>
            <span>{formatCurrency(sale.tax, symbol)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm border-t border-dashed border-gray-300 pt-1 mt-1">
          <span>TOTAL</span>
          <span>{formatCurrency(sale.total, symbol)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Payment</span>
          <span className="uppercase">{sale.paymentMethod}</span>
        </div>
        {sale.paymentMethod === 'cash' && parseFloat(sale.cashTendered) > 0 && (
          <>
            <div className="flex justify-between">
              <span>Cash Tendered</span>
              <span>{formatCurrency(sale.cashTendered, symbol)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Change</span>
              <span>{formatCurrency(sale.changeAmount, symbol)}</span>
            </div>
          </>
        )}
        {sale.splitPayments?.length > 0 && (
          <div className="mt-1">
            <p className="text-gray-500 text-xs">Split:</p>
            {sale.splitPayments.map((sp, i) => (
              <div key={i} className="flex justify-between pl-2">
                <span className="capitalize">{sp.method}</span>
                <span>{formatCurrency(sp.amount, symbol)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 border-t-2 border-dashed border-gray-300 pt-3">
        <p className="font-medium">{settings.receipt_footer || 'Thank you for your visit!'}</p>
        <p className="mt-2">🍦 Enjoy your treat! 🍦</p>
      </div>
    </div>
  );
});

export default Receipt;
