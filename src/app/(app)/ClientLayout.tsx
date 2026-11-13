'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

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
  const [workspace, setWorkspace] = useState<'laundry' | 'ca'>('laundry');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setWorkspace(pathname.startsWith('/ca') ? 'ca' : 'laundry');
    setMobileOpen(false); // close drawer on navigation
  }, [pathname]);

  const title = PAGE_TITLES[pathname] || 'LaundryMS';

  return (
    <div className="flex h-full min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar workspace={workspace} onWorkspaceChange={setWorkspace} />
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="relative z-50 flex-shrink-0 w-64 transition-transform duration-200">
            <Sidebar workspace={workspace} onWorkspaceChange={(w) => { setWorkspace(w); }} />
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header title={title} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
