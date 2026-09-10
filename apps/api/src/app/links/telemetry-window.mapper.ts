import { TelemetryWindow } from '@linkops-console/link';

const TELEMETRY_WINDOW_MS: Record<TelemetryWindow, number> = {
  '1m': 60_000,
  '5m': 300_000,
};

export function telemetryWindowToMs(window: TelemetryWindow): number {
  return TELEMETRY_WINDOW_MS[window];
}
