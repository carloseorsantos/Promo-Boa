import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SupermarketsService } from './supermarkets.service';
import { GeolocationQueryDto } from './dto/supermarket.dto';

@ApiTags('supermarkets')
@Controller('supermarkets')
export class SupermarketsController {
  constructor(private supermarketsService: SupermarketsService) {}

  @Get()
  findNearby(@Query() query: GeolocationQueryDto) {
    return this.supermarketsService.findNearby({
      lat: query.lat,
      lng: query.lng,
      radius: query.radius ?? 10,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.supermarketsService.findBySlug(slug);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.supermarketsService.findById(id);
  }
}
