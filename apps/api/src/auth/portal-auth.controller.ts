import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PortalAuthService } from './portal-auth.service';
import { RegisterUserDto, LoginDto } from './dto/auth.dto';

@ApiTags('portal-auth')
@Controller('portal/auth')
export class PortalAuthController {
  constructor(private portalAuthService: PortalAuthService) {}

  @Post('register')
  register(@Body() dto: RegisterUserDto) {
    return this.portalAuthService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.portalAuthService.login(dto);
  }
}
