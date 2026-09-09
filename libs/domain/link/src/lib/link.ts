export type Band = '5GHz' | '5.8GHz' | '11GHz' | '24GHz';
export type Mode = 'PtP' | 'PtMP' | 'S2S';
export type LinkStatus = 'up' | 'degraded' | 'down';
export type ChannelWidth = 20 | 40 | 80;

export interface Link {
  id: string;
  name: string;
  siteA: string;
  siteB: string;
  band: Band;
  mode: Mode;
  capacityMbps: number;
  txPowerDbm: number;
  channelWidthMhz: ChannelWidth;
  status: LinkStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}