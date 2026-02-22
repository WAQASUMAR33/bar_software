import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState('');

  const addItem = useCallback((product, variation = null) => {
    setItems(prev => {
      const key = variation ? `${product.id}-${variation.name}` : `${product.id}`;
      const existing = prev.find(i => i.key === key);
      if (existing) {
        return prev.map(i =>
          i.key === key
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price }
            : i
        );
      }
      const price = variation
        ? parseFloat(product.price) + parseFloat(variation.price_modifier || 0)
        : parseFloat(product.price);
      return [
        ...prev,
        {
          key,
          id: product.id,
          name: product.name,
          variation: variation ? variation.name : null,
          price,
          quantity: 1,
          discount: 0,
          total: price,
          category: product.category_name,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((key) => {
    setItems(prev => prev.filter(i => i.key !== key));
  }, []);

  const updateQuantity = useCallback((key, quantity) => {
    const qty = parseInt(quantity);
    if (qty <= 0) {
      removeItem(key);
      return;
    }
    setItems(prev =>
      prev.map(i =>
        i.key === key
          ? { ...i, quantity: qty, total: qty * (i.price - i.discount) }
          : i
      )
    );
  }, [removeItem]);

  const updateItemDiscount = useCallback((key, itemDiscount) => {
    setItems(prev =>
      prev.map(i =>
        i.key === key
          ? { ...i, discount: parseFloat(itemDiscount) || 0, total: i.quantity * (i.price - (parseFloat(itemDiscount) || 0)) }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCustomer(null);
    setDiscount(0);
    setNote('');
  }, []);

  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const totalDiscount = discount;
  const total = Math.max(0, subtotal - totalDiscount);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      customer,
      discount,
      note,
      subtotal,
      totalDiscount,
      total,
      itemCount,
      setCustomer,
      setDiscount,
      setNote,
      addItem,
      removeItem,
      updateQuantity,
      updateItemDiscount,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
