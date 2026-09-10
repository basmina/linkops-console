export type TelemetryWindow = '1m' | '5m';

export interface TelemetrySample {
  linkId: string;
  ts: string;
  rssiDbm: number;
  snrDb: number;
  throughputMbps: number;
}
