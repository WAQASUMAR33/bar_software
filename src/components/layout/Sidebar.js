import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

const NAV = [
  {
    group: 'Main',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'manager', 'cashier'] },
      { href: '/billing',   label: 'Billing / POS', icon: '🛒', roles: ['admin', 'manager', 'cashier'] },
      { href: '/tables',    label: 'Table Management', icon: '🪑', roles: ['admin', 'manager', 'cashier'] },
    ],
  },
  {
    group: 'Sales & Reports',
    items: [
      { href: '/reports',   label: 'Sales Reports',    icon: '📈', roles: ['admin', 'manager'] },
      { href: '/payments',  label: 'Payments',         icon: '💳', roles: ['admin', 'manager'] },
    ],
  },
  {
    group: 'Customers',
    items: [
      { href: '/customers', label: 'Customers',         icon: '👥', roles: ['admin', 'manager', 'cashier'] },
      { href: '/ledger',    label: 'Customer Ledger',   icon: '📒', roles: ['admin', 'manager'] },
    ],
  },
  {
    group: 'Inventory',
    items: [
      { href: '/products',   label: 'Products / Menu', icon: '🍦', roles: ['admin', 'manager'] },
      { href: '/categories', label: 'Categories',      icon: '🏷️', roles: ['admin', 'manager'] },
      { href: '/inventory',  label: 'Inventory',       icon: '📦', roles: ['admin', 'manager'] },
    ],
  },
  {
    group: 'Finance',
    items: [
      { href: '/expenses', label: 'Expenses', icon: '💰', roles: ['admin', 'manager'] },
    ],
  },
  {
    group: 'Administration',
    items: [
      { href: '/users',    label: 'Users & Roles',    icon: '👤', roles: ['admin'] },
      { href: '/settings', label: 'Settings',         icon: '⚙️', roles: ['admin'] },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const router = useRouter();
  const { user, logout } = useAuth();

  function isActive(href) {
    return router.pathname === href || router.pathname.startsWith(href + '/');
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-gray-900 z-30 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:flex
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
          <span className="text-3xl">🍦</span>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Holiday</p>
            <p className="text-blue-400 font-bold text-sm leading-tight">Ice Cream POS</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-white lg:hidden"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 sidebar-scroll">
          {NAV.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !user || item.roles.includes(user.role)
            );
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.group} className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                  {group.group}
                </p>
                {visibleItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-gray-400 text-xs capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:bg-red-900 hover:text-red-300 transition-colors text-sm"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
