import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { RegisterUserDto, LoginDto, UpdateUserDto } from './dto/auth.dto';
import { UserProfile, AuthTokens } from '@promo-boa/shared';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterUserDto): Promise<AuthTokens> {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, name: dto.name },
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user);
  }

  async loginWithGoogle(oauthData: {
    email: string;
    name: string;
    avatarUrl: string | null;
    oauthProviderId: string;
  }): Promise<AuthTokens> {
    let user = await this.prisma.user.findUnique({ where: { email: oauthData.email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: oauthData.email,
          name: oauthData.name,
          avatarUrl: oauthData.avatarUrl,
          oauthProvider: 'google',
          oauthProviderId: oauthData.oauthProviderId,
        },
      });
    }

    return this.issueTokens(user);
  }

  async refresh(token: string): Promise<AuthTokens> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.issueTokens(stored.user);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }

  async getMe(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.toProfile(user);
  }

  async updateMe(userId: string, dto: UpdateUserDto): Promise<UserProfile> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        preferredLocale: dto.preferredLocale,
        expoPushToken: dto.expoPushToken,
      },
    });
    return this.toProfile(user);
  }

  private async issueTokens(user: { id: string; email: string; name: string | null; avatarUrl: string | null; preferredLocale: string }): Promise<AuthTokens> {
    const accessToken = this.jwt.sign(
      { sub: user.id, type: 'user' },
      {
        secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
      },
    );

    const rawRefresh = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.refreshToken.create({
      data: { token: rawRefresh, userId: user.id, expiresAt },
    });

    return { accessToken, refreshToken: rawRefresh, user: this.toProfile(user) };
  }

  private toProfile(user: { id: string; email: string; name: string | null; avatarUrl: string | null; preferredLocale: string }): UserProfile {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      preferredLocale: user.preferredLocale,
    };
  }
}
