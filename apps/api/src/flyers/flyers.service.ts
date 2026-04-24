import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FlyerDetail, FlyerSummary } from '@promo-boa/shared';
import { CreateFlyerDto, UpdateFlyerDto } from './dto/flyer.dto';

@Injectable()
export class FlyersService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private notifications: NotificationsService,
    @InjectQueue('thumbnails') private thumbnailQueue: Queue,
  ) {}

  async findBySupermarket(supermarketId: string, page = 1, limit = 20): Promise<FlyerSummary[]> {
    const flyers = await this.prisma.flyer.findMany({
      where: { supermarketId },
      orderBy: { uploadedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return flyers.map((f) => this.toSummary(f));
  }

  async findById(id: string): Promise<FlyerDetail> {
    const flyer = await this.prisma.flyer.findUnique({ where: { id } });
    if (!flyer) throw new NotFoundException('Flyer not found');

    const pdfUrl = await this.storage.getSignedUrl(flyer.pdfStorageKey, 900);
    return {
      id: flyer.id,
      title: flyer.title,
      thumbnailUrl: flyer.thumbnailUrl,
      validFrom: flyer.validFrom.toISOString(),
      validTo: flyer.validTo.toISOString(),
      isExpired: flyer.validTo < new Date(),
      uploadedAt: flyer.uploadedAt.toISOString(),
      pdfUrl,
      supermarketId: flyer.supermarketId,
    };
  }

  async upload(
    accountId: string,
    supermarketId: string,
    file: Express.Multer.File,
    dto: CreateFlyerDto,
  ): Promise<FlyerSummary> {
    await this.assertOwner(accountId, supermarketId);

    if (!file || file.mimetype !== 'application/pdf') {
      throw new BadRequestException('File must be a PDF');
    }

    const key = `flyers/${supermarketId}/${Date.now()}-${file.originalname}`;
    const pdfUrl = await this.storage.uploadFile(key, file.buffer, 'application/pdf');

    const flyer = await this.prisma.flyer.create({
      data: {
        supermarketId,
        title: dto.title,
        pdfUrl,
        pdfStorageKey: key,
        validFrom: new Date(dto.validFrom),
        validTo: new Date(dto.validTo),
      },
    });

    await this.thumbnailQueue.add('generate', { flyerId: flyer.id, storageKey: key });

    // Notify users who favorited this supermarket with notifications enabled
    await this.notifications.dispatchFlyerUploaded(supermarketId, flyer.id);

    return this.toSummary(flyer);
  }

  async update(accountId: string, flyerId: string, dto: UpdateFlyerDto): Promise<FlyerSummary> {
    const flyer = await this.prisma.flyer.findUnique({ where: { id: flyerId } });
    if (!flyer) throw new NotFoundException('Flyer not found');
    await this.assertOwner(accountId, flyer.supermarketId);

    const updated = await this.prisma.flyer.update({
      where: { id: flyerId },
      data: {
        title: dto.title,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
      },
    });
    return this.toSummary(updated);
  }

  async remove(accountId: string, flyerId: string): Promise<void> {
    const flyer = await this.prisma.flyer.findUnique({ where: { id: flyerId } });
    if (!flyer) throw new NotFoundException('Flyer not found');
    await this.assertOwner(accountId, flyer.supermarketId);

    await this.storage.deleteFile(flyer.pdfStorageKey);
    await this.prisma.flyer.delete({ where: { id: flyerId } });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deactivateExpiredFlyers(): Promise<void> {
    await this.prisma.flyer.updateMany({
      where: { validTo: { lt: new Date() }, isActive: true },
      data: { isActive: false },
    });
  }

  private async assertOwner(accountId: string, supermarketId: string): Promise<void> {
    const supermarket = await this.prisma.supermarket.findUnique({
      where: { id: supermarketId },
    });
    if (!supermarket) throw new NotFoundException('Supermarket not found');
    if (supermarket.accountId !== accountId) throw new ForbiddenException();
  }

  private toSummary(flyer: { id: string; title: string; thumbnailUrl: string | null; validFrom: Date; validTo: Date; uploadedAt: Date }): FlyerSummary {
    return {
      id: flyer.id,
      title: flyer.title,
      thumbnailUrl: flyer.thumbnailUrl,
      validFrom: flyer.validFrom.toISOString(),
      validTo: flyer.validTo.toISOString(),
      isExpired: flyer.validTo < new Date(),
      uploadedAt: flyer.uploadedAt.toISOString(),
    };
  }
}
