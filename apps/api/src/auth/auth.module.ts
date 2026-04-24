import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { PortalAuthController } from './portal-auth.controller';
import { AuthService } from './auth.service';
import { PortalAuthService } from './portal-auth.service';
import { JwtUserStrategy } from './strategies/jwt-user.strategy';
import { JwtPortalStrategy } from './strategies/jwt-portal.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController, PortalAuthController],
  providers: [AuthService, PortalAuthService, JwtUserStrategy, JwtPortalStrategy, GoogleStrategy],
  exports: [AuthService, PortalAuthService],
})
export class AuthModule {}
