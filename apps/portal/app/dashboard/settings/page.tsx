'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { CreateSupermarketSchema, type CreateSupermarketInput } from '@promo-boa/shared';
import { portalApi } from '@/services/portal-api';
import { useAuthStore } from '@/store/auth.store';
import { DashboardLayout } from '@/components/DashboardLayout';

export default function SettingsPage() {
  const { account, supermarket, setSupermarket } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CreateSupermarketInput>({ resolver: zodResolver(CreateSupermarketSchema) });

  useEffect(() => {
    if (supermarket) {
      reset({
        name: supermarket.name,
        address: supermarket.address,
        city: supermarket.city,
        state: supermarket.state,
        latitude: supermarket.latitude,
        longitude: supermarket.longitude,
        phone: supermarket.phone ?? undefined,
        website: supermarket.website ?? undefined,
      });
    }
  }, [supermarket, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: CreateSupermarketInput) => {
      if (supermarket) {
        return portalApi.updateSupermarket(supermarket.id, data);
      }
      return portalApi.createSupermarket(data);
    },
    onSuccess: (updated) => setSupermarket(updated),
  });

  if (!account) return null;

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Perfil do Supermercado</h2>

        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
          {(['name', 'address', 'city'] as const).map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {field === 'name' ? 'Nome' : field === 'address' ? 'Endereço' : 'Cidade'}
              </label>
              <input
                {...register(field)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors[field] && (
                <p className="text-red-500 text-xs mt-1">{errors[field]!.message}</p>
              )}
            </div>
          ))}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado (UF)</label>
              <input
                {...register('state')}
                maxLength={2}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                placeholder="SP"
              />
              {errors.state && (
                <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                {...register('phone')}
                type="tel"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input
                {...register('latitude', { valueAsNumber: true })}
                type="number"
                step="any"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="-23.5505"
              />
              {errors.latitude && (
                <p className="text-red-500 text-xs mt-1">{errors.latitude.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input
                {...register('longitude', { valueAsNumber: true })}
                type="number"
                step="any"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="-46.6333"
              />
              {errors.longitude && (
                <p className="text-red-500 text-xs mt-1">{errors.longitude.message}</p>
              )}
            </div>
          </div>

          {saveMutation.isSuccess && (
            <p className="text-green-600 text-sm">Salvo com sucesso!</p>
          )}
          {saveMutation.isError && (
            <p className="text-red-500 text-sm">Erro ao salvar. Tente novamente.</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || saveMutation.isPending || !isDirty}
            className="w-full bg-primary text-white rounded-lg py-2.5 text-sm font-medium hover:bg-primary-dark transition disabled:opacity-60"
          >
            {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
