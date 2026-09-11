export type Band = '5GHz' | '5.8GHz' | '11GHz' | '24GHz';
export type Mode = 'PtP' | 'PtMP' | 'S2S';
export type LinkStatus = 'up' | 'degraded' | 'down';
export type ChannelWidth = 20 | 40 | 80;

export const BANDS: readonly Band[] = ['5GHz', '5.8GHz', '11GHz', '24GHz'];

export const MODES: readonly Mode[] = ['PtP', 'PtMP', 'S2S'];

export const CHANNEL_WIDTHS: readonly ChannelWidth[] = [20, 40, 80];

export const LINK_LIMITS = {
  nameMinLength: 3,
  nameMaxLength: 40,
  capacityMbpsMin: 10,
  capacityMbpsMax: 1000,
  txPowerDbmMin: -10,
  txPowerDbmMax: 30,
} as const;

export interface LinkConfig {
  name: string;
  siteA: string;
  siteB: string;
  band: Band;
  mode: Mode;
  capacityMbps: number;
  txPowerDbm: number;
  channelWidthMhz: ChannelWidth;
}

export interface Link extends LinkConfig {
  id: string;
  status: LinkStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}
