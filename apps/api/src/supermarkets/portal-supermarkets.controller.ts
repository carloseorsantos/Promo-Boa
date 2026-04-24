import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { SupermarketsService } from './supermarkets.service';
import { JwtPortalGuard } from '../common/guards/jwt-portal.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateSupermarketDto, UpdateSupermarketDto } from './dto/supermarket.dto';
import { SupermarketAccount } from '@prisma/client';

@ApiTags('portal-supermarkets')
@ApiBearerAuth()
@UseGuards(JwtPortalGuard)
@Controller('portal/supermarkets')
export class PortalSupermarketsController {
  constructor(private supermarketsService: SupermarketsService) {}

  @Post()
  create(
    @CurrentUser() account: SupermarketAccount,
    @Body() dto: CreateSupermarketDto,
  ) {
    return this.supermarketsService.create(account.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() account: SupermarketAccount,
    @Param('id') id: string,
    @Body() dto: UpdateSupermarketDto,
  ) {
    return this.supermarketsService.update(account.id, id, dto);
  }

  @Post(':id/logo')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo', { limits: { fileSize: 5 * 1024 * 1024 } }))
  uploadLogo(
    @CurrentUser() account: SupermarketAccount,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.supermarketsService.uploadLogo(account.id, id, file);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deactivate(
    @CurrentUser() account: SupermarketAccount,
    @Param('id') id: string,
  ) {
    return this.supermarketsService.deactivate(account.id, id);
  }
}
