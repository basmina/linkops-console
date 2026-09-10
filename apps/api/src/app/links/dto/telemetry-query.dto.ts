import { IsIn, IsOptional, IsString } from 'class-validator';
import { TelemetryWindow } from '@linkops-console/link';
export class TelemetryQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['1m', '5m'])
  window: TelemetryWindow = '5m';
}
