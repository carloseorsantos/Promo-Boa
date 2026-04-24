import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FlyersService } from './flyers.service';

@ApiTags('flyers')
@Controller()
export class FlyersController {
  constructor(private flyersService: FlyersService) {}

  @Get('supermarkets/:supermarketId/flyers')
  findBySupermarket(
    @Param('supermarketId') supermarketId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.flyersService.findBySupermarket(supermarketId, page, limit);
  }

  @Get('flyers/:id')
  findById(@Param('id') id: string) {
    return this.flyersService.findById(id);
  }
}
