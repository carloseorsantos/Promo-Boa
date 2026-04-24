import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FavoriteItem } from '@promo-boa/shared';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string): Promise<FavoriteItem[]> {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        supermarket: {
          include: {
            flyers: {
              where: { isActive: true, validTo: { gte: new Date() } },
              orderBy: { uploadedAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((fav) => ({
      id: fav.id,
      supermarketId: fav.supermarketId,
      notifyEnabled: fav.notifyEnabled,
      createdAt: fav.createdAt.toISOString(),
      supermarket: {
        id: fav.supermarket.id,
        name: fav.supermarket.name,
        slug: fav.supermarket.slug,
        logoUrl: fav.supermarket.logoUrl,
        address: fav.supermarket.address,
        city: fav.supermarket.city,
        state: fav.supermarket.state,
        latitude: fav.supermarket.latitude,
        longitude: fav.supermarket.longitude,
        activeFlyer: fav.supermarket.flyers[0]
          ? {
              id: fav.supermarket.flyers[0].id,
              title: fav.supermarket.flyers[0].title,
              thumbnailUrl: fav.supermarket.flyers[0].thumbnailUrl,
              validFrom: fav.supermarket.flyers[0].validFrom.toISOString(),
              validTo: fav.supermarket.flyers[0].validTo.toISOString(),
              isExpired: fav.supermarket.flyers[0].validTo < new Date(),
              uploadedAt: fav.supermarket.flyers[0].uploadedAt.toISOString(),
            }
          : null,
      },
    }));
  }

  async add(userId: string, supermarketId: string): Promise<{ id: string }> {
    const exists = await this.prisma.favorite.findUnique({
      where: { userId_supermarketId: { userId, supermarketId } },
    });
    if (exists) throw new ConflictException('Already in favorites');

    const fav = await this.prisma.favorite.create({
      data: { userId, supermarketId },
    });
    return { id: fav.id };
  }

  async remove(userId: string, supermarketId: string): Promise<void> {
    const fav = await this.prisma.favorite.findUnique({
      where: { userId_supermarketId: { userId, supermarketId } },
    });
    if (!fav) throw new NotFoundException('Favorite not found');
    await this.prisma.favorite.delete({ where: { id: fav.id } });
  }

  async updateNotification(
    userId: string,
    supermarketId: string,
    enabled: boolean,
  ): Promise<void> {
    const fav = await this.prisma.favorite.findUnique({
      where: { userId_supermarketId: { userId, supermarketId } },
    });
    if (!fav) throw new NotFoundException('Favorite not found');
    await this.prisma.favorite.update({
      where: { id: fav.id },
      data: { notifyEnabled: enabled },
    });
  }
}
