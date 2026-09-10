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
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLinkDto implements LinkConfig {
  @IsString()
  @MinLength(LINK_LIMITS.nameMinLength)
  @MaxLength(LINK_LIMITS.nameMaxLength)
  name!: string;

  @IsString()
  siteA!: string;

  @IsString()
  siteB!: string;

  @IsIn(BANDS)
  band!: Band;

  @IsIn(MODES)
  mode!: Mode;

  @Type(() => Number)
  @IsNumber()
  @Min(LINK_LIMITS.capacityMbpsMin)
  @Max(LINK_LIMITS.capacityMbpsMax)
  capacityMbps!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(LINK_LIMITS.txPowerDbmMin)
  @Max(LINK_LIMITS.txPowerDbmMax)
  txPowerDbm!: number;

  @Type(() => Number)
  @IsIn(CHANNEL_WIDTHS)
  channelWidthMhz!: ChannelWidth;
}
