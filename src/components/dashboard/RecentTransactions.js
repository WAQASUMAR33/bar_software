import Link from 'next/link';
import { formatCurrency, formatDateTime } from '@/lib/utils';

const METHOD_BADGE = {
  cash:   'badge-success',
  card:   'badge-info',
  online: 'badge-warning',
  credit: 'badge-danger',
  split:  'badge-gray',
};

export default function RecentTransactions({ transactions = [], symbol = 'PKR ' }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title">Recent Transactions</h3>
        <Link href="/reports" className="text-sm text-blue-600 hover:underline">
          View all
        </Link>
      </div>

      {transactions.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">No transactions today</p>
      ) : (
        <div className="space-y-3">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🛒</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{t.saleNumber}</p>
                <p className="text-xs text-gray-400">{formatDateTime(t.createdAt)}</p>
                {t.customer && (
                  <p className="text-xs text-gray-500">{t.customer.name}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-gray-900">{formatCurrency(t.total, symbol)}</p>
                <span className={`badge ${METHOD_BADGE[t.paymentMethod] || 'badge-gray'} capitalize`}>
                  {t.paymentMethod}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
