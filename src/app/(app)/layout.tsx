import { Suspense } from 'react';
import ClientLayout from './ClientLayout';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex h-full min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-maroon-600 border-t-transparent rounded-full" />
      </div>
    }>
      <ClientLayout>{children}</ClientLayout>
    </Suspense>
  );
}
