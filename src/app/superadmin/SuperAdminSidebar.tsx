'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Building2, Plus, BarChart3, Settings, LogOut, Zap,
  ChevronRight, CreditCard, FileText, Activity, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import ConfirmModal from '@/components/ui/ConfirmModal';

type NavItem = {
  label: string;
  href: string;
  icon: any;
  children?: NavItem[];
};

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/superadmin/dashboard', icon: LayoutDashboard },
  {
    label: 'Manage Laundries', href: '#laundries', icon: Building2,
    children: [
      { label: 'All Laundries', href: '/superadmin/laundries', icon: Building2 },
      { label: 'Add Laundry', href: '/superadmin/laundries/new', icon: Plus },
    ],
  },
  { label: 'Analytics', href: '/superadmin/analytics', icon: BarChart3 },
  { label: 'Subscription Plans', href: '/superadmin/subscriptions', icon: CreditCard },
  { label: 'Reports', href: '/superadmin/reports', icon: FileText },
  { label: 'Activity Logs', href: '/superadmin/logs', icon: Activity },
  { label: 'Settings', href: '/superadmin/settings', icon: Settings },
];

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const hasChildren = !!item.children?.length;
  const isChildActive = hasChildren && item.children!.some(c => pathname === c.href || pathname.startsWith(`${c.href}/`));
  const [open, setOpen] = useState(isChildActive);
  const Icon = item.icon;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
            isChildActive ? 'text-white bg-gray-800' : 'text-gray-400 hover:bg-gray-800 hover:text-white',
          )}
        >
          <Icon size={16} className="flex-shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown size={13} className={cn('transition-transform', open ? 'rotate-180' : '')} />
        </button>
        {open && (
          <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-700 pl-3">
            {item.children!.map((c) => (
              <NavLink key={c.href} item={c} pathname={pathname} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = pathname === item.href || (item.href !== '/superadmin/laundries' && pathname.startsWith(`${item.href}/`));
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
        isActive ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white',
      )}
    >
      <Icon size={16} className="flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      {isActive && <ChevronRight size={14} />}
    </Link>
  );
}

export default function SuperAdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const contextOrgName =
    typeof window !== 'undefined' ? localStorage.getItem('contextOrgName') : null;

  const exitContext = () => {
    localStorage.removeItem('contextToken');
    localStorage.removeItem('contextOrgName');
    router.push('/superadmin/dashboard');
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white w-64 min-h-screen">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-sm leading-tight">LaundryMS</div>
            <div className="text-xs text-purple-400 leading-tight">Super Admin</div>
          </div>
        </div>
      </div>

      {/* Context banner */}
      {contextOrgName && (
        <div className="mx-3 mt-3 p-2.5 bg-purple-900/60 border border-purple-700 rounded-lg">
          <div className="text-xs text-purple-300 mb-0.5">Viewing as</div>
          <div className="text-sm font-medium text-white truncate">{contextOrgName}</div>
          <button
            onClick={exitContext}
            className="mt-1.5 text-xs text-purple-400 hover:text-white underline"
          >
            Exit context →
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        {NAV.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      {/* User info */}
      <div className="px-3 py-3 border-t border-gray-700">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
            {user?.name?.charAt(0) || 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.name || 'Super Admin'}</div>
            <div className="text-xs text-gray-400 truncate">Super Admin</div>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="text-gray-400 hover:text-white transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <ConfirmModal
        open={showLogoutConfirm}
        title="Sign out?"
        message="You'll be returned to the login page. Any unsaved work will be lost."
        confirmLabel="Sign out"
        cancelLabel="Stay"
        variant="warning"
        onConfirm={() => { setShowLogoutConfirm(false); logout(); }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
