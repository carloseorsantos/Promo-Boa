'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FlyerSummary } from '@promo-boa/shared';
import { portalApi } from '@/services/portal-api';

interface Props {
  flyer: FlyerSummary;
}

export function FlyerCard({ flyer }: Props) {
  const qc = useQueryClient();
  const now = new Date();
  const validTo = new Date(flyer.validTo);
  const isExpired = validTo < now;
  const daysLeft = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const deleteMutation = useMutation({
    mutationFn: () => portalApi.deleteFlyer(flyer.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal-flyers'] }),
  });

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition">
      {flyer.thumbnailUrl ? (
        <img src={flyer.thumbnailUrl} alt={flyer.title} className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
          <span className="text-4xl">📄</span>
        </div>
      )}

      <div className="p-4">
        <h3 className="font-semibold text-gray-800 text-sm mb-1 truncate">{flyer.title}</h3>
        <p className="text-xs text-gray-400">
          {fmt(flyer.validFrom)} – {fmt(flyer.validTo)}
        </p>

        <div className="mt-2 flex items-center justify-between">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              isExpired
                ? 'bg-gray-100 text-gray-500'
                : daysLeft <= 3
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-green-50 text-green-700'
            }`}
          >
            {isExpired
              ? 'Expirado'
              : daysLeft <= 3
                ? `Expira em ${daysLeft}d`
                : 'Ativo'}
          </span>

          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="text-xs text-red-400 hover:text-red-600 transition disabled:opacity-50"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
