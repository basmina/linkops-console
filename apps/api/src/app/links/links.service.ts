import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  deriveStatus,
  LINK_REPOSITORY,
  Link,
  LinkRepository,
  TelemetrySample,
  FleetSummary,
} from '@linkops-console/link';

import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';
import { randomUUID } from 'crypto';
import { TelemetrySimulatorService } from './telemetry-simulator.service';

@Injectable()
export class LinksService {
  constructor(
    @Inject(LINK_REPOSITORY)
    private readonly repository: LinkRepository,
    private readonly telemetrySimulator: TelemetrySimulatorService,
  ) {}

  private toLiveLink(link: Link, now = new Date()): Link {
    const latestSample = this.telemetrySimulator.getLatest(link.id);
    return {
      ...link,
      status: deriveStatus(link, latestSample, now),
    };
  }
  async findAll(): Promise<Link[]> {
    const links = await this.repository.findAll();
    const now = new Date();
    return links.map((link) => this.toLiveLink(link, now));
  }

  async findOne(id: string): Promise<Link> {
    const link = await this.repository.findById(id);

    if (!link) {
      throw new NotFoundException({
        error: {
          code: 'LINK_NOT_FOUND',
          message: `Link '${id}' was not found`,
        },
      });
    }

    return this.toLiveLink(link);
  }

  async create(dto: CreateLinkDto): Promise<Link> {
    const links = await this.repository.findAll();

    const duplicate = links.some(
      (link) => link.name.toLowerCase() === dto.name.toLowerCase(),
    );

    if (duplicate) {
      throw new ConflictException({
        error: {
          code: 'LINK_NAME_EXISTS',
          message: `A link named '${dto.name}' already exists`,
        },
      });
    }

    const now = new Date().toISOString();

    const link: Link = {
      id: randomUUID(),
      name: dto.name,
      siteA: dto.siteA,
      siteB: dto.siteB,
      band: dto.band,
      mode: dto.mode,
      capacityMbps: dto.capacityMbps,
      txPowerDbm: dto.txPowerDbm,
      channelWidthMhz: dto.channelWidthMhz,
      status: 'down',
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    return this.repository.create(link);
  }

  async update(id: string, dto: UpdateLinkDto): Promise<Link> {
    const existing = await this.findOne(id);

    if (existing.version !== dto.version) {
      throw new ConflictException({
        error: {
          code: 'LINK_VERSION_CONFLICT',
          message: 'Link was modified by someone else',
          details: {
            currentVersion: existing.version,
          },
        },
      });
    }

    const links = await this.repository.findAll();

    const duplicate = links.some(
      (link) =>
        link.id !== id &&
        dto.name !== undefined &&
        link.name.toLowerCase() === dto.name.toLowerCase(),
    );

    if (duplicate) {
      throw new ConflictException({
        error: {
          code: 'LINK_NAME_EXISTS',
          message: `A link named '${dto.name}' already exists`,
        },
      });
    }

    const updated: Link = {
      ...existing,
      ...dto,
      status: existing.status,
      version: existing.version + 1,
      updatedAt: new Date().toISOString(),
    };

    return this.repository.update(updated);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.delete(id);
    this.telemetrySimulator.removeLink(id);
  }

  async getTelemetry(id: string, windowMs: number): Promise<TelemetrySample[]> {
    await this.findOne(id);
    const samples = this.telemetrySimulator.getHistory(id);
    const cutOff = Date.now() - windowMs;
    return samples.filter((s) => new Date(s.ts).getTime() >= cutOff);
  }

  async getFleetSummary(): Promise<FleetSummary> {
    const links = await this.repository.findAll();
    const now = new Date();

    const latestSamples = new Map<string, TelemetrySample | undefined>();

    const liveLinks = links.map((link) => {
      const latestSample = this.telemetrySimulator.getLatest(link.id);
      latestSamples.set(link.id, latestSample);

      return {
        ...link,
        status: deriveStatus(link, latestSample, now),
      };
    });
    let totalThroughput = 0;
    let worstLinkId: string | null = null;
    let worstThroughputRatio = Number.POSITIVE_INFINITY;

    let up = 0;
    let degraded = 0;
    let down = 0;

    for (const link of liveLinks) {
      switch (link.status) {
        case 'up':
          up++;
          break;
        case 'degraded':
          degraded++;
          break;
        case 'down':
          down++;
          break;
      }

      const latest = latestSamples.get(link.id);

      if (latest) {
        totalThroughput += latest.throughputMbps;

        const throughputRatio = latest.throughputMbps / link.capacityMbps;

        if (throughputRatio < worstThroughputRatio) {
          worstThroughputRatio = throughputRatio;
          worstLinkId = link.id;
        }
      }
    }

    return {
      total: liveLinks.length,
      up,
      degraded,
      down,
      avgThroughputMbps:
        liveLinks.length > 0
          ? Number((totalThroughput / liveLinks.length).toFixed(2))
          : 0,
      worstLinkId,
    };
  }
}
