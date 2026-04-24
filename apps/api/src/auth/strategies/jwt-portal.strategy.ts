import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

interface JwtPayload {
  sub: string;
  type: string;
}

@Injectable()
export class JwtPortalStrategy extends PassportStrategy(Strategy, 'jwt-portal') {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow('JWT_PORTAL_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.type !== 'portal') throw new UnauthorizedException();

    const account = await this.prisma.supermarketAccount.findUnique({
      where: { id: payload.sub },
      include: { supermarket: true },
    });
    if (!account) throw new UnauthorizedException();
    return account;
  }
}
