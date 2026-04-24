'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { portalApi } from '@/services/portal-api';
import { FlyerCard } from '@/components/FlyerCard';
import { DashboardLayout } from '@/components/DashboardLayout';

export default function DashboardPage() {
  const router = useRouter();
  const { account, supermarket } = useAuthStore();

  const { data: flyers = [], isLoading } = useQuery({
    queryKey: ['portal-flyers', supermarket?.id],
    queryFn: () => portalApi.getFlyers(supermarket!.id),
    enabled: !!supermarket,
  });

  if (!account) {
    router.replace('/auth/login');
    return null;
  }

  if (!supermarket) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Perfil do supermercado não configurado
          </h2>
          <p className="text-gray-500 mb-6">
            Configure as informações do seu supermercado para começar a publicar folhetos.
          </p>
          <button
            onClick={() => router.push('/dashboard/settings')}
            className="bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-dark transition"
          >
            Configurar perfil
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Meus Folhetos</h2>
        <button
          onClick={() => router.push('/dashboard/upload')}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition"
        >
          + Novo Folheto
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : flyers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">Nenhum folheto publicado ainda</p>
          <p className="text-sm">Clique em &quot;Novo Folheto&quot; para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {flyers.map((flyer) => (
            <FlyerCard key={flyer.id} flyer={flyer} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
