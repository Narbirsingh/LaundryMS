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

  useEffect(() => {
    setWorkspace(pathname.startsWith('/ca') ? 'ca' : 'laundry');
  }, [pathname]);

  const title = PAGE_TITLES[pathname] || 'LaundryMS';

  return (
    <div className="flex h-full min-h-screen">
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar workspace={workspace} onWorkspaceChange={setWorkspace} />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
