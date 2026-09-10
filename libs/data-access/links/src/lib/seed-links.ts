import { Link } from '@linkops-console/link';
import { randomUUID } from 'crypto';

const bands: Link['band'][] = ['5GHz', '5.8GHz', '11GHz', '24GHz'];
const modes: Link['mode'][] = ['PtP', 'PtMP', 'S2S'];
const widths: Link['channelWidthMhz'][] = [20, 40, 80];

export function seedLinks(count = 10): Link[] {
  const now = new Date().toISOString();
  return Array.from({ length: count }, (_, i) => ({
    id: randomUUID(),
    name: `Link-${i + 1}`,
    siteA: `Site-${i * 2 + 1}`,
    siteB: `Site-${i * 2 + 2}`,
    band: bands[i % bands.length],
    mode: modes[i % modes.length],
    capacityMbps: [100, 200, 500, 1000][i % 4],
    txPowerDbm: 10 + (i % 5),
    channelWidthMhz: widths[i % widths.length],
    status: 'down',
    version: 1,
    createdAt: now,
    updatedAt: now,
  }));
}
