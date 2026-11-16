import { Suspense } from 'react';
import SuperAdminDashboardClient from './DashboardClient';

export default function SuperAdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
        </div>
      }
    >
      <SuperAdminDashboardClient />
    </Suspense>
  );
}
