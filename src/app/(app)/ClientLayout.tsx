'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/orders': 'Orders',
  '/customers': 'Customers',
  '/pickup-delivery': 'Pickup & Delivery',
  '/production': 'Production',
  '/services': 'Services & Pricing',
  '/inventory': 'Inventory',
  '/billing': 'Billing & Payments',
  '/expenses': 'Expenses',
  '/employees': 'Employees',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/ca': 'CA Dashboard',
  '/ca/clients': 'CA Clients',
  '/ca/documents': 'Documents',
  '/ca/reconciliation': 'Reconciliation',
  '/ca/readiness': 'ITR Readiness',
  '/ca/computation': 'Tax Computation',
  '/ca/filing': 'Filing Status',
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [workspace, setWorkspace] = useState<'laundry' | 'ca'>('laundry');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role === 'SUPER_ADMIN') {
        router.replace('/superadmin/dashboard');
      }
    }
  }, [loading, user, router]);

  useEffect(() => {
    setWorkspace(pathname.startsWith('/ca') ? 'ca' : 'laundry');
    setMobileOpen(false);
  }, [pathname]);

  const title = PAGE_TITLES[pathname] || 'LaundryMS';

  if (loading || !user || user.role === 'SUPER_ADMIN') {
    return (
      <>
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="animate-spin w-8 h-8 border-4 border-maroon-600 border-t-transparent rounded-full" />
        </div>
        <div style={{ display: 'none' }}>{children}</div>
      </>
    );
  }

  return (
    <div className="flex h-full min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar workspace={workspace} onWorkspaceChange={setWorkspace} />
      </div>

      {/* Mobile drawer overlay */}
      <div className={cn('fixed inset-0 z-40 flex md:hidden transition-all duration-300', mobileOpen ? 'visible' : 'invisible')}>
        {/* Backdrop */}
        <div
          className={cn('fixed inset-0 bg-black/50 transition-opacity duration-300', mobileOpen ? 'opacity-100' : 'opacity-0')}
          onClick={() => setMobileOpen(false)}
        />
        {/* Drawer slide-in */}
        <div className={cn('relative z-50 flex-shrink-0 w-64 transition-transform duration-300', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
          <Sidebar workspace={workspace} onWorkspaceChange={(w) => { setWorkspace(w); }} onClose={() => setMobileOpen(false)} />
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header title={title} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
