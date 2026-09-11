import { generateSample } from './generate-sample';
import { Link } from './link';

describe('generateSample', () => {
  const link: Link = {
    id: 'link-1',
    name: 'Test',
    siteA: 'A',
    siteB: 'B',
    band: '5GHz',
    mode: 'PtP',
    capacityMbps: 100,
    txPowerDbm: 10,
    channelWidthMhz: 40,
    status: 'up',
    version: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  it('generates a sample with the correct linkId', () => {
    const sample = generateSample(link, undefined);
    expect(sample.linkId).toBe('link-1');
  });

  it('keeps throughput within [0, capacityMbps]', () => {
    for (let i = 0; i < 50; i++) {
      const sample = generateSample(link, undefined);
      expect(sample.throughputMbps).toBeGreaterThanOrEqual(0);
      expect(sample.throughputMbps).toBeLessThanOrEqual(link.capacityMbps);
    }
  });

  it('keeps snrDb within [0, 40]', () => {
    for (let i = 0; i < 50; i++) {
      const sample = generateSample(link, undefined);
      expect(sample.snrDb).toBeGreaterThanOrEqual(0);
      expect(sample.snrDb).toBeLessThanOrEqual(40);
    }
  });

  it('keeps rssiDbm within a realistic range', () => {
    for (let i = 0; i < 50; i++) {
      const sample = generateSample(link, undefined);

      expect(sample.rssiDbm).toBeGreaterThanOrEqual(-90);

      expect(sample.rssiDbm).toBeLessThanOrEqual(-30);
    }
  });

  it('drifts from the previous sample rather than resetting completely', () => {
    const first = generateSample(link, undefined);
    const second = generateSample(link, first);
    expect(Math.abs(second.snrDb - first.snrDb)).toBeLessThan(15);
  });

  it('is fully deterministic when given a fixed clock and RNG', () => {
    const now = new Date('2026-01-01T00:00:05.000Z');
    const options = { now, random: () => 0.5 };

    const first = generateSample(link, undefined, options);
    const second = generateSample(link, undefined, options);

    expect(first).toEqual(second);
    expect(first.ts).toBe(now.toISOString());
  });
});
