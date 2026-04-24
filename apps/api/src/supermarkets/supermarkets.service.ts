import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { SupermarketSummary, SupermarketDetail, FlyerSummary } from '@promo-boa/shared';
import { CreateSupermarketDto, UpdateSupermarketDto } from './dto/supermarket.dto';
import { Supermarket } from '@prisma/client';

interface GeoQueryParams {
  lat: number;
  lng: number;
  radius: number;
  page: number;
  limit: number;
}

interface RawSupermarketRow extends Supermarket {
  distance_meters: number;
}

@Injectable()
export class SupermarketsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async findNearby(params: GeoQueryParams): Promise<SupermarketSummary[]> {
    const { lat, lng, radius, page, limit } = params;
    const radiusMeters = radius * 1000;
    const offset = (page - 1) * limit;

    // Uses PostgreSQL earthdistance + cube extensions (must be enabled via migration)
    const rows = await this.prisma.$queryRaw<RawSupermarketRow[]>`
      SELECT s.*,
             earth_distance(ll_to_earth(s.latitude, s.longitude), ll_to_earth(${lat}, ${lng})) AS distance_meters
      FROM "Supermarket" s
      WHERE s."isActive" = true
        AND earth_box(ll_to_earth(${lat}, ${lng}), ${radiusMeters}) @> ll_to_earth(s.latitude, s.longitude)
      ORDER BY distance_meters ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const supermarketIds = rows.map((r) => r.id);
    const flyers = await this.prisma.flyer.findMany({
      where: {
        supermarketId: { in: supermarketIds },
        isActive: true,
        validTo: { gte: new Date() },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    const flyerBySupermarket = new Map(flyers.map((f) => [f.supermarketId, f]));

    return rows.map((row) => {
      const flyer = flyerBySupermarket.get(row.id);
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        logoUrl: row.logoUrl,
        address: row.address,
        city: row.city,
        state: row.state,
        latitude: row.latitude,
        longitude: row.longitude,
        distanceKm: Math.round((row.distance_meters / 1000) * 10) / 10,
        activeFlyer: flyer ? this.toFlyerSummary(flyer) : null,
      };
    });
  }

  async findById(id: string): Promise<SupermarketDetail> {
    const supermarket = await this.prisma.supermarket.findUnique({
      where: { id, isActive: true },
      include: {
        flyers: {
          orderBy: { uploadedAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!supermarket) throw new NotFoundException('Supermarket not found');
    return this.toDetail(supermarket);
  }

  async findBySlug(slug: string): Promise<SupermarketDetail> {
    const supermarket = await this.prisma.supermarket.findUnique({
      where: { slug, isActive: true },
      include: { flyers: { orderBy: { uploadedAt: 'desc' }, take: 10 } },
    });
    if (!supermarket) throw new NotFoundException('Supermarket not found');
    return this.toDetail(supermarket);
  }

  async create(accountId: string, dto: CreateSupermarketDto): Promise<SupermarketDetail> {
    const existing = await this.prisma.supermarket.findUnique({ where: { accountId } });
    if (existing) throw new ConflictException('Account already has a supermarket profile');

    const slug = this.generateSlug(dto.name);
    const supermarket = await this.prisma.supermarket.create({
      data: { ...dto, accountId, slug },
      include: { flyers: true },
    });
    return this.toDetail(supermarket);
  }

  async update(
    accountId: string,
    supermarketId: string,
    dto: UpdateSupermarketDto,
  ): Promise<SupermarketDetail> {
    await this.assertOwner(accountId, supermarketId);
    const supermarket = await this.prisma.supermarket.update({
      where: { id: supermarketId },
      data: dto,
      include: { flyers: { orderBy: { uploadedAt: 'desc' }, take: 10 } },
    });
    return this.toDetail(supermarket);
  }

  async uploadLogo(accountId: string, supermarketId: string, file: Express.Multer.File): Promise<string> {
    await this.assertOwner(accountId, supermarketId);
    const key = `logos/${supermarketId}/${Date.now()}-${file.originalname}`;
    const logoUrl = await this.storage.uploadFile(key, file.buffer, file.mimetype);
    await this.prisma.supermarket.update({ where: { id: supermarketId }, data: { logoUrl } });
    return logoUrl;
  }

  async deactivate(accountId: string, supermarketId: string): Promise<void> {
    await this.assertOwner(accountId, supermarketId);
    await this.prisma.supermarket.update({
      where: { id: supermarketId },
      data: { isActive: false },
    });
  }

  private async assertOwner(accountId: string, supermarketId: string): Promise<Supermarket> {
    const supermarket = await this.prisma.supermarket.findUnique({
      where: { id: supermarketId },
    });
    if (!supermarket) throw new NotFoundException('Supermarket not found');
    if (supermarket.accountId !== accountId) throw new ForbiddenException();
    return supermarket;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Math.random().toString(36).slice(2, 7);
  }

  private toFlyerSummary(flyer: { id: string; title: string; thumbnailUrl: string | null; validFrom: Date; validTo: Date; uploadedAt: Date }): FlyerSummary {
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

  private toDetail(supermarket: Supermarket & { flyers: Array<{ id: string; title: string; thumbnailUrl: string | null; validFrom: Date; validTo: Date; uploadedAt: Date; isActive: boolean }> }): SupermarketDetail {
    const now = new Date();
    const activeFlyer = supermarket.flyers.find(
      (f) => f.isActive && f.validTo >= now,
    ) ?? null;

    return {
      id: supermarket.id,
      name: supermarket.name,
      slug: supermarket.slug,
      logoUrl: supermarket.logoUrl,
      address: supermarket.address,
      city: supermarket.city,
      state: supermarket.state,
      latitude: supermarket.latitude,
      longitude: supermarket.longitude,
      phone: supermarket.phone,
      website: supermarket.website,
      isVerified: supermarket.isVerified,
      activeFlyer: activeFlyer ? this.toFlyerSummary(activeFlyer) : null,
      flyers: supermarket.flyers.map((f) => this.toFlyerSummary(f)),
    };
  }
}
