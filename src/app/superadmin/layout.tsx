import { Suspense } from 'react';
import SuperAdminClientLayout from './SuperAdminClientLayout';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
        </div>
      }
    >
      <SuperAdminClientLayout>{children}</SuperAdminClientLayout>
    </Suspense>
  );
}
