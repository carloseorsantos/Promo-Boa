'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { account, supermarket, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-primary">PromoBoa</h1>
          {supermarket && (
            <span className="text-sm text-gray-500">{supermarket.name}</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/settings')}
            className="text-sm text-gray-500 hover:text-primary transition"
          >
            Configurações
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-600 transition"
          >
            Sair
          </button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
