import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AddFavoriteDto, UpdateFavoriteNotificationDto } from './dto/favorite.dto';
import { User } from '@prisma/client';

@ApiTags('favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.favoritesService.list(user.id);
  }

  @Post()
  add(@CurrentUser() user: User, @Body() dto: AddFavoriteDto) {
    return this.favoritesService.add(user.id, dto.supermarketId);
  }

  @Delete(':supermarketId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: User, @Param('supermarketId') supermarketId: string) {
    return this.favoritesService.remove(user.id, supermarketId);
  }

  @Patch(':supermarketId/notifications')
  @HttpCode(HttpStatus.NO_CONTENT)
  updateNotification(
    @CurrentUser() user: User,
    @Param('supermarketId') supermarketId: string,
    @Body() dto: UpdateFavoriteNotificationDto,
  ) {
    return this.favoritesService.updateNotification(user.id, supermarketId, dto.enabled);
  }
}
