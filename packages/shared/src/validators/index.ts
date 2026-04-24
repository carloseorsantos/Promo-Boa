import { z } from 'zod';

export const RegisterUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(100).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  preferredLocale: z.enum(['pt-BR', 'en']).optional(),
  expoPushToken: z.string().optional().nullable(),
});

export const RegisterSupermarketAccountSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const CreateSupermarketSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2).max(2),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: z.string().optional(),
  website: z.string().url().optional(),
});

export const UpdateSupermarketSchema = CreateSupermarketSchema.partial();

export const CreateFlyerSchema = z.object({
  title: z.string().min(1).max(200),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime(),
});

export const UpdateFlyerSchema = CreateFlyerSchema.partial();

export const GeolocationQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1).max(100).default(10),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const AddFavoriteSchema = z.object({
  supermarketId: z.string().uuid(),
});

export const UpdateFavoriteNotificationSchema = z.object({
  enabled: z.boolean(),
});

export const ResetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type RegisterSupermarketAccountInput = z.infer<typeof RegisterSupermarketAccountSchema>;
export type CreateSupermarketInput = z.infer<typeof CreateSupermarketSchema>;
export type UpdateSupermarketInput = z.infer<typeof UpdateSupermarketSchema>;
export type CreateFlyerInput = z.infer<typeof CreateFlyerSchema>;
export type UpdateFlyerInput = z.infer<typeof UpdateFlyerSchema>;
export type GeolocationQueryInput = z.infer<typeof GeolocationQuerySchema>;
export type AddFavoriteInput = z.infer<typeof AddFavoriteSchema>;
export type UpdateFavoriteNotificationInput = z.infer<typeof UpdateFavoriteNotificationSchema>;
