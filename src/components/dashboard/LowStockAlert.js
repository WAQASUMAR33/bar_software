import Link from 'next/link';

export default function LowStockAlert({ products = [] }) {
  if (products.length === 0) return null;

  return (
    <div className="card p-5 border-l-4 border-orange-400">
      <div className="flex items-center justify-between mb-3">
        <h3 className="section-title flex items-center gap-2 text-orange-600">
          <span>⚠️</span> Low Stock Alert
        </h3>
        <Link href="/inventory" className="text-sm text-blue-600 hover:underline">
          Manage
        </Link>
      </div>
      <div className="space-y-2">
        {products.slice(0, 5).map((p) => (
          <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-800">{p.name}</p>
              <p className="text-xs text-gray-400">{p.category?.name}</p>
            </div>
            <span className={`badge ${p.stock === 0 ? 'badge-danger' : 'badge-warning'}`}>
              {p.stock} left
            </span>
          </div>
        ))}
      </div>
      {products.length > 5 && (
        <p className="text-xs text-gray-400 mt-2 text-center">
          +{products.length - 5} more products low on stock
        </p>
      )}
    </div>
  );
}
