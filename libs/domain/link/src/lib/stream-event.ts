import { LinkStatus } from './link';
import { TelemetrySample } from './telemetry';
import { FleetSummary } from './fleet-summary';
export type LinkStreamEvent =
  | {
      type: 'telemetry';
      sample: TelemetrySample[];
    }
  | {
      type: 'status';
      linkId: string;
      status: LinkStatus;
    }
  | {
      type: 'summary';
      summary: FleetSummary;
    };
