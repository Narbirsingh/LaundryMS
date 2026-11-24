'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import SuperAdminSidebar from './SuperAdminSidebar';
import { useAuth } from '@/hooks/useAuth';

const PAGE_TITLES: Record<string, string> = {
  '/superadmin/dashboard': 'Platform Dashboard',
  '/superadmin/laundries': 'Laundries',
  '/superadmin/laundries/new': 'Register New Laundry',
  '/superadmin/analytics': 'Analytics',
  '/superadmin/settings': 'Platform Settings',
};

export default function SuperAdminClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role !== 'SUPER_ADMIN') {
        router.replace('/dashboard');
      }
    }
  }, [loading, user, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const title =
    PAGE_TITLES[pathname] ||
    (pathname.match(/\/superadmin\/laundries\/[^/]+$/) ? 'Laundry Details' : 'Super Admin');

  if (loading) {
    return (
      <>
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
        </div>
        <div style={{ display: 'none' }}>{children}</div>
      </>
    );
  }

  if (!user || user.role !== 'SUPER_ADMIN') {
    return <div style={{ display: 'none' }}>{children}</div>;
  }

  return (
    <div className="flex h-full min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <SuperAdminSidebar />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 flex-shrink-0 w-64">
            <SuperAdminSidebar />
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-gray-500 hover:text-gray-900 md:hidden"
          >
            <Menu size={20} />
          </button>
          <h1 className="font-semibold text-gray-900 text-base flex-1">{title}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              SA
            </div>
            <span className="hidden sm:inline">Super Admin</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
