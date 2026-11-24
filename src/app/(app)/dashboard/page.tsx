import { Suspense } from 'react';
import DashboardClient from './DashboardClient';

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-maroon-600 border-t-transparent rounded-full" />
        </div>
      }
    >
      <DashboardClient />
    </Suspense>
  );
}
