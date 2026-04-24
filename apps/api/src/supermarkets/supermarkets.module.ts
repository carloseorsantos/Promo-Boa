import { Module } from '@nestjs/common';
import { SupermarketsController } from './supermarkets.controller';
import { PortalSupermarketsController } from './portal-supermarkets.controller';
import { SupermarketsService } from './supermarkets.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [SupermarketsController, PortalSupermarketsController],
  providers: [SupermarketsService],
  exports: [SupermarketsService],
})
export class SupermarketsModule {}
