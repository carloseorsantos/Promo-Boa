'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateFlyerSchema, type CreateFlyerInput } from '@promo-boa/shared';
import { portalApi } from '@/services/portal-api';
import { useAuthStore } from '@/store/auth.store';
import { DashboardLayout } from '@/components/DashboardLayout';

export default function UploadFlyerPage() {
  const router = useRouter();
  const { supermarket } = useAuthStore();
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateFlyerInput>({ resolver: zodResolver(CreateFlyerSchema) });

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  const uploadMutation = useMutation({
    mutationFn: (data: CreateFlyerInput) => {
      if (!file || !supermarket) throw new Error('Missing file or supermarket');
      setUploadProgress(0);
      return portalApi.uploadFlyer(supermarket.id, file, data, (p) => setUploadProgress(p));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-flyers'] });
      router.push('/dashboard');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao enviar folheto';
      setServerError(msg);
    },
  });

  const onSubmit = (data: CreateFlyerInput) => uploadMutation.mutate(data);

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Novo Folheto</h2>

        {serverError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{serverError}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
              isDragActive ? 'border-primary bg-green-50' : 'border-gray-300 hover:border-primary'
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div>
                <p className="font-medium text-gray-700">📄 {file.name}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 text-sm">
                  Arraste o PDF aqui ou <span className="text-primary font-medium">clique para selecionar</span>
                </p>
                <p className="text-gray-400 text-xs mt-1">PDF, máx. 50 MB</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              {...register('title')}
              type="text"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: Ofertas da Semana"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Válido de</label>
              <input
                {...register('validFrom')}
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.validFrom && (
                <p className="text-red-500 text-xs mt-1">{errors.validFrom.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Válido até</label>
              <input
                {...register('validTo')}
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.validTo && (
                <p className="text-red-500 text-xs mt-1">{errors.validTo.message}</p>
              )}
            </div>
          </div>

          {uploadMutation.isPending && (
            <div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1 text-right">{uploadProgress}%</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !file || uploadMutation.isPending}
            className="w-full bg-primary text-white rounded-lg py-2.5 text-sm font-medium hover:bg-primary-dark transition disabled:opacity-60"
          >
            {uploadMutation.isPending ? 'Enviando...' : 'Publicar Folheto'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
