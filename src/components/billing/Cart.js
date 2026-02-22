import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';

export default function Cart({ onCheckout, onHold, symbol = 'PKR ' }) {
  const {
    items, customer, discount, subtotal, totalDiscount, total,
    removeItem, updateQuantity, updateItemDiscount, setDiscount, setCustomer, clearCart,
  } = useCart();

  const [discountInput, setDiscountInput] = useState('');

  function applyDiscount() {
    const val = parseFloat(discountInput) || 0;
    setDiscount(val);
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <span>🛒</span> Cart
          {items.length > 0 && (
            <span className="badge badge-info ml-1">{items.length}</span>
          )}
        </h3>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-red-500 hover:text-red-700 transition-colors font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Customer */}
      <div className="px-4 py-2 border-b border-gray-50">
        <p className="text-xs text-gray-400 mb-1">Customer</p>
        <p className="text-sm font-medium text-gray-700">{customer?.name || 'Walk-in Customer'}</p>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-2">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-300 py-12">
            <span className="text-5xl mb-3">🛒</span>
            <p className="text-sm">Cart is empty</p>
            <p className="text-xs mt-1">Add products to start billing</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <CartItem
                key={item.key}
                item={item}
                symbol={symbol}
                onRemove={() => removeItem(item.key)}
                onQtyChange={(q) => updateQuantity(item.key, q)}
                onDiscountChange={(d) => updateItemDiscount(item.key, d)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Discount */}
      {items.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100">
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Overall discount"
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              className="input text-sm flex-1"
              min="0"
            />
            <button onClick={applyDiscount} className="btn btn-secondary btn-sm whitespace-nowrap">
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Totals */}
      {items.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl space-y-1.5">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal, symbol)}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-sm text-red-500">
              <span>Discount</span>
              <span>-{formatCurrency(totalDiscount, symbol)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg text-gray-900 pt-1 border-t border-gray-200">
            <span>Total</span>
            <span className="text-blue-600">{formatCurrency(total, symbol)}</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onHold}
              className="btn btn-secondary btn-sm flex-1"
            >
              Hold
            </button>
            <button
              onClick={onCheckout}
              className="btn btn-primary flex-1 text-base font-bold py-3"
            >
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CartItem({ item, symbol, onRemove, onQtyChange, onDiscountChange }) {
  const [showDiscount, setShowDiscount] = useState(false);

  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
          {item.variation && (
            <p className="text-xs text-gray-400">{item.variation}</p>
          )}
          <p className="text-xs text-blue-600 font-semibold">
            {formatCurrency(item.price, symbol)} each
          </p>
        </div>
        <button onClick={onRemove} className="text-gray-300 hover:text-red-400 transition-colors p-1">
          ✕
        </button>
      </div>

      <div className="flex items-center justify-between mt-2">
        {/* Qty controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onQtyChange(item.quantity - 1)}
            className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:border-blue-400 transition-colors font-bold"
          >
            −
          </button>
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => onQtyChange(e.target.value)}
            className="w-10 text-center text-sm font-bold border border-gray-200 rounded-lg py-0.5"
            min="1"
          />
          <button
            onClick={() => onQtyChange(item.quantity + 1)}
            className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:border-blue-400 transition-colors font-bold"
          >
            +
          </button>
        </div>

        <div className="text-right">
          <p className="text-sm font-bold text-gray-900">{formatCurrency(item.total, symbol)}</p>
          <button
            onClick={() => setShowDiscount(!showDiscount)}
            className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
          >
            {showDiscount ? 'Hide' : 'Discount'}
          </button>
        </div>
      </div>

      {showDiscount && (
        <input
          type="number"
          placeholder="Item discount"
          defaultValue={item.discount || ''}
          onBlur={(e) => onDiscountChange(e.target.value)}
          className="input text-sm mt-2"
          min="0"
        />
      )}
    </div>
  );
}
