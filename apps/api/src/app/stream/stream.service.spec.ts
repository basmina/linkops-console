import { Subject } from 'rxjs';
import { LinkStreamEvent, TelemetrySample } from '@linkops-console/link';

import { StreamService } from './stream.service';
import { TelemetrySimulatorService } from '../links/telemetry-simulator.service';
import { LinksService } from '../links/links.service';

describe('StreamService', () => {
  let service: StreamService;
  let samplesGenerated$: Subject<TelemetrySample[]>;
  let statusChanged$: Subject<{
    linkId: string;
    status: 'up' | 'degraded' | 'down';
  }>;

  const summary = {
    total: 1,
    up: 1,
    degraded: 0,
    down: 0,
    avgThroughputMbps: 70,
    worstLinkId: 'link-1',
  };

  const sample: TelemetrySample = {
    linkId: 'link-1',
    ts: '2026-09-10T14:00:00.000Z',
    rssiDbm: -40,
    snrDb: 22,
    throughputMbps: 70,
  };

  beforeEach(() => {
    samplesGenerated$ = new Subject<TelemetrySample[]>();
    statusChanged$ = new Subject<{
      linkId: string;
      status: 'up' | 'degraded' | 'down';
    }>();

    const telemetrySimulator = {
      samplesGenerated$,
      statusChanged$,
      getLatestSamples: () => [sample],
    } as unknown as TelemetrySimulatorService;

    const linksService = {
      getFleetSummary: async () => summary,
    } as unknown as LinksService;

    service = new StreamService(telemetrySimulator, linksService);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('sends summary and latest telemetry to a fresh client', async () => {
    const events: LinkStreamEvent[] = [];

    const subscription = service
      .getEvents()
      .subscribe((envelope) => events.push(envelope.event));

    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(events).toEqual([
      {
        type: 'summary',
        summary,
      },
      {
        type: 'telemetry',
        sample: [sample],
      },
    ]);

    subscription.unsubscribe();
  });

  it('does not add the initial snapshot to replay history', async () => {
    const firstSubscription = service.getEvents().subscribe();

    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    firstSubscription.unsubscribe();

    const events: LinkStreamEvent[] = [];

    const reconnectSubscription = service
      .getEvents(0)
      .subscribe((envelope) => events.push(envelope.event));

    expect(events).toEqual([]);

    reconnectSubscription.unsubscribe();
  });

  it('replays only events newer than the last event id', () => {
    const events: LinkStreamEvent[] = [];

    samplesGenerated$.next([sample]);
    samplesGenerated$.next([sample]);

    const subscription = service
      .getEvents(1)
      .subscribe((envelope) => events.push(envelope.event));

    expect(events).toEqual([
      {
        type: 'telemetry',
        sample: [sample],
      },
    ]);

    subscription.unsubscribe();
  });

  it('does not lose live events while the initial snapshot is loading', async () => {
    let resolveSummary!: () => void;

    const delayedSummary = new Promise<typeof summary>((resolve) => {
      resolveSummary = () => resolve(summary);
    });

    const telemetrySimulator = {
      samplesGenerated$,
      statusChanged$,
      getLatestSamples: () => [sample],
    } as unknown as TelemetrySimulatorService;

    const linksService = {
      getFleetSummary: () => delayedSummary,
    } as unknown as LinksService;

    service.onModuleDestroy();

    service = new StreamService(telemetrySimulator, linksService);

    const events: LinkStreamEvent[] = [];

    const subscription = service
      .getEvents()
      .subscribe((envelope) => events.push(envelope.event));

    samplesGenerated$.next([sample]);

    expect(events).toEqual([]);

    resolveSummary();

    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(events.slice(0, 2)).toEqual([
      {
        type: 'summary',
        summary,
      },
      {
        type: 'telemetry',
        sample: [sample],
      },
    ]);

    expect(events.slice(2)).toEqual([
      {
        type: 'telemetry',
        sample: [sample],
      },
      {
        type: 'summary',
        summary,
      },
    ]);

    subscription.unsubscribe();
  });
});
