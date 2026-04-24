import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { FlyersController } from './flyers.controller';
import { PortalFlyersController } from './portal-flyers.controller';
import { FlyersService } from './flyers.service';
import { ThumbnailProcessor } from './thumbnail.processor';
import { StorageModule } from '../storage/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    StorageModule,
    NotificationsModule,
    BullModule.registerQueue({ name: 'thumbnails' }),
  ],
  controllers: [FlyersController, PortalFlyersController],
  providers: [FlyersService, ThumbnailProcessor],
})
export class FlyersModule {}
