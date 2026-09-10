import {
  Band,
  BANDS,
  ChannelWidth,
  CHANNEL_WIDTHS,
  LINK_LIMITS,
  LinkConfig,
  Mode,
  MODES,
} from '@linkops-console/link';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateLinkDto implements Partial<LinkConfig> {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @IsString()
  @MinLength(LINK_LIMITS.nameMinLength)
  @MaxLength(LINK_LIMITS.nameMaxLength)
  name?: string;

  @IsOptional()
  @IsString()
  siteA?: string;

  @IsOptional()
  @IsString()
  siteB?: string;

  @IsOptional()
  @IsIn(BANDS)
  band?: Band;

  @IsOptional()
  @IsIn(MODES)
  mode?: Mode;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(LINK_LIMITS.capacityMbpsMin)
  @Max(LINK_LIMITS.capacityMbpsMax)
  capacityMbps?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(LINK_LIMITS.txPowerDbmMin)
  @Max(LINK_LIMITS.txPowerDbmMax)
  txPowerDbm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn(CHANNEL_WIDTHS)
  channelWidthMhz?: ChannelWidth;
}
