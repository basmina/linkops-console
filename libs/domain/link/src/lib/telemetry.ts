export interface TelemetrySample {
  linkId: string;
  ts: string;
  rssiDbm: number;
  snrDb: number;
  throughputMbps: number;
}