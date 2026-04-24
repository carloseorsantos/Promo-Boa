import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { RegisterUserDto, LoginDto } from './dto/auth.dto';

interface PortalTokens {
  accessToken: string;
  account: { id: string; email: string };
}

@Injectable()
export class PortalAuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterUserDto): Promise<PortalTokens> {
    const exists = await this.prisma.supermarketAccount.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const account = await this.prisma.supermarketAccount.create({
      data: { email: dto.email, passwordHash },
    });

    return this.issuePortalToken(account);
  }

  async login(dto: LoginDto): Promise<PortalTokens> {
    const account = await this.prisma.supermarketAccount.findUnique({
      where: { email: dto.email },
    });
    if (!account) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, account.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issuePortalToken(account);
  }

  private issuePortalToken(account: { id: string; email: string }): PortalTokens {
    const accessToken = this.jwt.sign(
      { sub: account.id, type: 'portal' },
      {
        secret: this.config.getOrThrow('JWT_PORTAL_SECRET'),
        expiresIn: '7d',
      },
    );
    return { accessToken, account: { id: account.id, email: account.email } };
  }
}
