import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Observable, Subject, Subscriber, Subscription, filter } from 'rxjs';
import { LinkStreamEvent } from '@linkops-console/link';
import { TelemetrySimulatorService } from '../links/telemetry-simulator.service';
import { LinksService } from '../links/links.service';
interface StreamEnvelope {
  id: number;
  event: LinkStreamEvent;
}
type StreamFrame = StreamEnvelope | { event: LinkStreamEvent };
const REPLAY_BUFFER_SIZE = 120;
const SUMMARY_INTERVAL_MS = 5000;

@Injectable()
export class StreamService implements OnModuleDestroy {
  private readonly history: StreamEnvelope[] = [];
  private readonly live$ = new Subject<StreamEnvelope>();
  private readonly logger = new Logger(StreamService.name);
  private nextEventId = 1;
  private lastSummaryAt = 0;

  private readonly telemetrySubscription: Subscription;
  private readonly statusSubscription: Subscription;

  constructor(
    private readonly telemetrySimulator: TelemetrySimulatorService,
    private readonly linksService: LinksService,
  ) {
    this.telemetrySubscription =
      this.telemetrySimulator.samplesGenerated$.subscribe((samples) => {
        const event: LinkStreamEvent = {
          type: 'telemetry',
          sample: samples,
        };
        this.publish(event);

        const now = Date.now();

        if (now - this.lastSummaryAt >= SUMMARY_INTERVAL_MS) {
          this.lastSummaryAt = now;
          void this.publishSummary().catch((error: unknown) => {
            this.logger.error('Failed to publish fleet summary', error);
          });
        }
      });

    this.statusSubscription = this.telemetrySimulator.statusChanged$.subscribe(
      (change) => {
        const event: LinkStreamEvent = {
          type: 'status',
          linkId: change.linkId,
          status: change.status,
        };

        this.publish(event);
      },
    );
  }

  private async publishSummary(): Promise<void> {
    const summary = await this.linksService.getFleetSummary();

    const event: LinkStreamEvent = {
      type: 'summary',
      summary,
    };

    this.publish(event);
  }

  getEvents(lastEventId?: number): Observable<StreamFrame> {
    return new Observable<StreamFrame>((subscriber) => {
      const bufferedEvents: StreamEnvelope[] = [];
      let snapshotReady = lastEventId !== undefined;

      const liveSubscription = this.live$
        .pipe(
          filter(
            (envelope) =>
              lastEventId === undefined || envelope.id > lastEventId,
          ),
        )
        .subscribe((envelope) => {
          if (!snapshotReady) {
            bufferedEvents.push(envelope);
            return;
          }

          subscriber.next(envelope);
        });

      if (lastEventId !== undefined) {
        for (const envelope of this.history) {
          if (envelope.id > lastEventId) {
            subscriber.next(envelope);
          }
        }
      } else {
        void this.sendInitialSnapshot(subscriber).then(() => {
          if (subscriber.closed) {
            return;
          }

          snapshotReady = true;

          for (const envelope of bufferedEvents) {
            subscriber.next(envelope);
          }

          bufferedEvents.length = 0;
        });
      }

      return () => {
        liveSubscription.unsubscribe();
        bufferedEvents.length = 0;
      };
    });
  }

  private async sendInitialSnapshot(
    subscriber: Subscriber<StreamFrame>,
  ): Promise<void> {
    try {
      const summary = await this.linksService.getFleetSummary();

      if (subscriber.closed) {
        return;
      }

      subscriber.next({
        event: {
          type: 'summary',
          summary,
        },
      });

      const samples = this.telemetrySimulator.getLatestSamples();

      if (subscriber.closed) {
        return;
      }

      subscriber.next({
        event: {
          type: 'telemetry',
          sample: samples,
        },
      });
    } catch (error: unknown) {
      this.logger.error('Failed to send initial SSE snapshot', error);
    }
  }

  private publish(event: LinkStreamEvent): void {
    const envelope: StreamEnvelope = {
      id: this.nextEventId++,
      event,
    };

    this.history.push(envelope);

    if (this.history.length > REPLAY_BUFFER_SIZE) {
      this.history.shift();
    }

    this.live$.next(envelope);
  }

  onModuleDestroy(): void {
    this.telemetrySubscription.unsubscribe();
    this.statusSubscription.unsubscribe();

    this.live$.complete();
    this.history.length = 0;
  }
}
