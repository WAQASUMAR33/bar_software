import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';
import Modal from '@/components/ui/Modal';

export default function ProductGrid({ products = [], categories = [], symbol = 'PKR ' }) {
  const { addItem } = useCart();
  const [activeCategory, setActiveCategory] = useState('all');
  const [variationProduct, setVariationProduct] = useState(null);

  const filtered =
    activeCategory === 'all'
      ? products
      : products.filter((p) => String(p.categoryId) === String(activeCategory));

  function handleAdd(product) {
    if (product.variations && product.variations.length > 0) {
      setVariationProduct(product);
    } else {
      addItem(product);
    }
  }

  function handleVariationSelect(variation) {
    addItem(variationProduct, variation);
    setVariationProduct(null);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Category tabs */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-thin flex-shrink-0">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            activeCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(String(c.id))}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === String(c.id)
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto scrollbar-thin flex-1">
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <p>No products found</p>
          </div>
        )}
        {filtered.map((product) => (
          <button
            key={product.id}
            onClick={() => handleAdd(product)}
            disabled={product.stock === 0}
            className={`pos-product-card text-left ${product.stock === 0 ? 'out-of-stock' : ''}`}
          >
            <p className="text-sm font-bold text-gray-800 leading-tight mb-1 line-clamp-2">
              {product.name}
            </p>
            <p className="text-sm font-bold text-blue-600">
              {formatCurrency(product.price, symbol)}
            </p>
            {product.stock <= 10 && product.stock > 0 && (
              <p className="text-xs text-orange-500 mt-0.5">Only {product.stock} left</p>
            )}
            {product.stock === 0 && (
              <p className="text-xs text-red-500 mt-0.5">Out of stock</p>
            )}
          </button>
        ))}
      </div>

      {/* Variation picker modal */}
      <Modal
        isOpen={!!variationProduct}
        onClose={() => setVariationProduct(null)}
        title={variationProduct?.name}
        size="sm"
      >
        <p className="text-sm text-gray-500 mb-4">Select an option:</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleVariationSelect(null)}
            className="p-3 border-2 border-blue-500 rounded-xl text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            Standard
            <br />
            <span className="font-bold">{formatCurrency(variationProduct?.price, symbol)}</span>
          </button>
          {variationProduct?.variations?.map((v) => (
            <button
              key={v.id}
              onClick={() => handleVariationSelect(v)}
              className="p-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-blue-400 hover:bg-blue-50"
            >
              {v.name}
              <br />
              <span className="font-bold text-blue-600">
                {formatCurrency(
                  parseFloat(variationProduct?.price || 0) + parseFloat(v.priceModifier || 0),
                  symbol
                )}
              </span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
