export interface FleetSummary {
  total: number;
  up: number;
  degraded: number;
  down: number;
  avgThroughputMbps: number;
  worstLinkId: string | null;
}
