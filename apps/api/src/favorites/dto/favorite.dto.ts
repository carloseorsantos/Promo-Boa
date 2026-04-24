import { IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddFavoriteDto {
  @ApiProperty()
  @IsUUID()
  supermarketId: string;
}

export class UpdateFavoriteNotificationDto {
  @ApiProperty()
  @IsBoolean()
  enabled: boolean;
}
