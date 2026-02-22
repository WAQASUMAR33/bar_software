import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

const PAGE_TITLES = {
  '/dashboard':  'Dashboard',
  '/billing':    'Billing / POS',
  '/reports':    'Sales Reports',
  '/payments':   'Payments',
  '/customers':  'Customers',
  '/ledger':     'Customer Ledger',
  '/products':   'Products / Menu',
  '/categories': 'Categories',
  '/inventory':  'Inventory',
  '/expenses':   'Expenses',
  '/users':      'Users & Roles',
  '/settings':   'Settings',
};

export default function Header({ onMenuToggle }) {
  const router = useRouter();
  const { user } = useAuth();

  const title =
    Object.entries(PAGE_TITLES).find(([path]) =>
      router.pathname === path || router.pathname.startsWith(path + '/')
    )?.[1] || 'POS';

  const now = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
      {/* Hamburger (mobile) */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Page title */}
      <h1 className="text-xl font-bold text-gray-800 flex-1">{title}</h1>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-sm text-gray-500">{now}</span>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-800 leading-tight">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
