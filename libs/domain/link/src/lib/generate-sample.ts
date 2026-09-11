import { Link } from './link';
import { TelemetrySample } from './telemetry';

const BASE_SNR_DB = 22;
const BASE_THROUGHPUT_RATIO = 0.7;

const NORMAL_SNR_DRIFT = 1;
const NORMAL_THROUGHPUT_DRIFT_RATIO = 0.04;

const DEGRADED_EVENT_PROBABILITY = 0.05;
const DOWN_EVENT_PROBABILITY = 0.01;

export interface GenerateSampleOptions {
  now?: Date;
  random?: () => number;
}

export function generateSample(
  link: Link,
  previous: TelemetrySample | undefined,
  options: GenerateSampleOptions = {},
): TelemetrySample {
  const now = options.now ?? new Date();
  const random = options.random ?? Math.random;

  const previousSnr = previous?.snrDb ?? BASE_SNR_DB;

  const previousThroughput =
    previous?.throughputMbps ?? link.capacityMbps * BASE_THROUGHPUT_RATIO;

  const snrRecovery = (BASE_SNR_DB - previousSnr) * 0.1;

  const throughputRecovery =
    (link.capacityMbps * BASE_THROUGHPUT_RATIO - previousThroughput) * 0.1;

  const snrDrift = (random() - 0.5) * 2 * NORMAL_SNR_DRIFT;

  const throughputDrift =
    (random() - 0.5) * 2 * NORMAL_THROUGHPUT_DRIFT_RATIO * link.capacityMbps;

  let snrDb = previousSnr + snrRecovery + snrDrift;

  let throughputMbps =
    previousThroughput + throughputRecovery + throughputDrift;

  const eventRoll = random();

  if (eventRoll < DOWN_EVENT_PROBABILITY) {
    snrDb -= 12;
    throughputMbps *= 0.15;
  } else if (eventRoll < DOWN_EVENT_PROBABILITY + DEGRADED_EVENT_PROBABILITY) {
    snrDb -= 6;
    throughputMbps *= 0.45;
  }

  snrDb = Math.max(0, Math.min(40, snrDb));

  throughputMbps = Math.max(0, Math.min(link.capacityMbps, throughputMbps));

  const rssiDbm = Math.max(-90, Math.min(-30, -30 - (40 - snrDb)));

  return {
    linkId: link.id,
    ts: now.toISOString(),
    rssiDbm: Math.round(rssiDbm),
    snrDb: Math.round(snrDb * 10) / 10,
    throughputMbps: Math.round(throughputMbps * 10) / 10,
  };
}
