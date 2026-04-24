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
import { FlyersService } from './flyers.service';
import { JwtPortalGuard } from '../common/guards/jwt-portal.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateFlyerDto, UpdateFlyerDto } from './dto/flyer.dto';
import { SupermarketAccount } from '@prisma/client';

@ApiTags('portal-flyers')
@ApiBearerAuth()
@UseGuards(JwtPortalGuard)
@Controller('portal')
export class PortalFlyersController {
  constructor(private flyersService: FlyersService) {}

  @Post('supermarkets/:supermarketId/flyers')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('pdf', { limits: { fileSize: 50 * 1024 * 1024 } }))
  upload(
    @CurrentUser() account: SupermarketAccount,
    @Param('supermarketId') supermarketId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateFlyerDto,
  ) {
    return this.flyersService.upload(account.id, supermarketId, file, dto);
  }

  @Patch('flyers/:id')
  updateFlyer(
    @CurrentUser() account: SupermarketAccount,
    @Param('id') id: string,
    @Body() dto: UpdateFlyerDto,
  ) {
    return this.flyersService.update(account.id, id, dto);
  }

  @Delete('flyers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteFlyer(
    @CurrentUser() account: SupermarketAccount,
    @Param('id') id: string,
  ) {
    return this.flyersService.remove(account.id, id);
  }
}
