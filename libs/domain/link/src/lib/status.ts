import { Link, LinkStatus } from './link';
import { TelemetrySample } from './telemetry';

export function deriveStatus(
  link: Pick<Link, 'capacityMbps'>,
  latestSample: TelemetrySample | undefined,
  now: Date,
): LinkStatus {
  if (!latestSample) return 'down';

  const ageMs = now.getTime() - new Date(latestSample.ts).getTime();
  if (ageMs > 5000) return 'down';

  const { snrDb, throughputMbps } = latestSample;
  const capacity = link.capacityMbps;

  if (snrDb >= 18 && throughputMbps >= 0.6 * capacity) return 'up';
  if (snrDb >= 10 && throughputMbps >= 0.2 * capacity) return 'degraded';
  return 'down';
}