import { deriveStatus } from './status';
import { Link } from './link';
import { TelemetrySample } from './telemetry';

describe('deriveStatus', () => {
  const link: Pick<Link, 'capacityMbps'> = { capacityMbps: 100 };
  const now = new Date('2026-01-01T00:00:00.000Z');

  function sample(overrides: Partial<TelemetrySample>): TelemetrySample {
    return {
      linkId: 'link-1',
      ts: '2026-01-01T00:00:00.000Z',
      rssiDbm: -60,
      snrDb: 20,
      throughputMbps: 80,
      ...overrides,
    };
  }

  it('returns "down" when there is no sample', () => {
    expect(deriveStatus(link, undefined, now)).toBe('down');
  });

  it('returns "down" when the latest sample is older than 5 seconds', () => {
    const stale = sample({ ts: '2025-12-31T23:59:54.000Z' });
    expect(deriveStatus(link, stale, now)).toBe('down');
  });

  it('returns "up" when snr and throughput both meet the "up" thresholds', () => {
    const s = sample({ snrDb: 18, throughputMbps: 60 });
    expect(deriveStatus(link, s, now)).toBe('up');
  });

  it('returns "degraded" when thresholds fall below "up" but above "down"', () => {
    const s = sample({ snrDb: 12, throughputMbps: 25 });
    expect(deriveStatus(link, s, now)).toBe('degraded');
  });

  it('returns "down" when snr and throughput are both too low', () => {
    const s = sample({ snrDb: 5, throughputMbps: 5 });
    expect(deriveStatus(link, s, now)).toBe('down');
  });
});