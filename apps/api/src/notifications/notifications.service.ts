import { Injectable, Logger } from '@nestjs/common';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class NotificationsService {
  private expo = new Expo();
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async dispatchFlyerUploaded(supermarketId: string, flyerId: string): Promise<void> {
    const supermarket = await this.prisma.supermarket.findUnique({
      where: { id: supermarketId },
      select: { name: true },
    });
    if (!supermarket) return;

    const favorites = await this.prisma.favorite.findMany({
      where: { supermarketId, notifyEnabled: true },
      include: { user: { select: { expoPushToken: true } } },
    });

    const tokens = favorites
      .map((f) => f.user.expoPushToken)
      .filter((t): t is string => !!t && Expo.isExpoPushToken(t));

    if (tokens.length === 0) return;

    const messages: ExpoPushMessage[] = tokens.map((to) => ({
      to,
      sound: 'default',
      title: `Nova promoção em ${supermarket.name}!`,
      body: 'Confira as ofertas desta semana.',
      data: { supermarketId, flyerId },
    }));

    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await this.expo.sendPushNotificationsAsync(chunk);
      } catch (err) {
        this.logger.error('Failed to send push notifications', err);
      }
    }
  }
}
