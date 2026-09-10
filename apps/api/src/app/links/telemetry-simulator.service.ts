import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Subject } from 'rxjs';

import {
  deriveStatus,
  LINK_REPOSITORY,
  Link,
  LinkRepository,
  LinkStatus,
  RingBuffer,
  TelemetrySample,
  generateSample,
} from '@linkops-console/link';

import { LinkSeedService } from '../links/link-seed.service';

const BUFFER_SIZE = 300;
const TICK_MS = 1000;

@Injectable()
export class TelemetrySimulatorService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(TelemetrySimulatorService.name);

  private readonly buffers = new Map<string, RingBuffer<TelemetrySample>>();

  private readonly latest = new Map<string, TelemetrySample>();

  private readonly statusByLinkId = new Map<string, LinkStatus>();

  private intervalHandle: ReturnType<typeof setInterval> | undefined;

  readonly samplesGenerated$ = new Subject<TelemetrySample[]>();

  readonly statusChanged$ = new Subject<{
    linkId: string;
    status: LinkStatus;
  }>();

  constructor(
    @Inject(LINK_REPOSITORY)
    private readonly repo: LinkRepository,

    private readonly seedService: LinkSeedService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedService.seed();

    const links = await this.repo.findAll();

    await this.tick();

    this.intervalHandle = setInterval(() => {
      void this.tick();
    }, TICK_MS);

    this.logger.log(
      `Telemetry simulator started for ${links.length} links, buffer size ${BUFFER_SIZE}.`,
    );
  }

  onModuleDestroy(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = undefined;
    }

    this.samplesGenerated$.complete();
    this.statusChanged$.complete();
  }

  private async tick(): Promise<void> {
    const links = await this.repo.findAll();
    const now = new Date();

    const samples: TelemetrySample[] = [];

    for (const link of links) {
      const previousSample = this.latest.get(link.id);

      const sample = generateSample(link, previousSample);

      this.latest.set(link.id, sample);

      let buffer = this.buffers.get(link.id);

      if (!buffer) {
        buffer = new RingBuffer<TelemetrySample>(BUFFER_SIZE);

        this.buffers.set(link.id, buffer);
      }

      buffer.push(sample);

      samples.push(sample);

      const status = deriveStatus(link, sample, now);

      const previousStatus = this.statusByLinkId.get(link.id);

      if (previousStatus === undefined || previousStatus !== status) {
        this.statusByLinkId.set(link.id, status);

        this.statusChanged$.next({
          linkId: link.id,
          status,
        });
      }
    }

    this.samplesGenerated$.next(samples);
  }

  removeLink(linkId: string): void {
    this.buffers.delete(linkId);
    this.latest.delete(linkId);
    this.statusByLinkId.delete(linkId);
  }

  getHistory(linkId: string): TelemetrySample[] {
    return this.buffers.get(linkId)?.toArray() ?? [];
  }

  getLatest(linkId: string): TelemetrySample | undefined {
    return this.latest.get(linkId);
  }

  getLatestSamples(): TelemetrySample[] {
    return Array.from(this.latest.values());
  }
}
