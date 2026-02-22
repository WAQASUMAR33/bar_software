import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import StatsCard from '@/components/dashboard/StatsCard';
import SalesChart from '@/components/dashboard/SalesChart';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import LowStockAlert from '@/components/dashboard/LowStockAlert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const symbol = data?.settings?.currency_symbol || 'PKR ';

  if (loading) return <Layout><LoadingSpinner text="Loading dashboard..." /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Today's Revenue"
            value={formatCurrency(data?.today?.revenue, symbol)}
            icon="💰"
            color="blue"
            sub={`${data?.today?.transactions || 0} transactions`}
          />
          <StatsCard
            title="Monthly Revenue"
            value={formatCurrency(data?.month?.revenue, symbol)}
            icon="📈"
            color="green"
          />
          <StatsCard
            title="Today's Expenses"
            value={formatCurrency(data?.today?.expenses, symbol)}
            icon="💸"
            color="orange"
          />
          <StatsCard
            title="Total Customers"
            value={data?.totalCustomers || 0}
            icon="👥"
            color="purple"
            sub={`${data?.totalProducts || 0} active products`}
          />
        </div>

        {/* Chart & Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SalesChart data={data?.chartData || []} symbol={symbol} />
          </div>
          <div className="card p-5">
            <h3 className="section-title mb-4">Top Products (Month)</h3>
            {data?.topProducts?.length === 0 ? (
              <p className="text-gray-400 text-sm">No data yet</p>
            ) : (
              <div className="space-y-3">
                {data?.topProducts?.map((p, i) => (
                  <div key={p.productId} className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-300 w-6">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.productName}</p>
                      <p className="text-xs text-gray-400">{p._sum.quantity} sold</p>
                    </div>
                    <p className="text-sm font-bold text-blue-600">{formatCurrency(p._sum.total, symbol)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent transactions & Low stock */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentTransactions transactions={data?.recentSales || []} symbol={symbol} />
          </div>
          <LowStockAlert products={data?.lowStockProducts || []} />
        </div>
      </div>
    </Layout>
  );
}

DashboardPage.getLayout = (page) => page;
