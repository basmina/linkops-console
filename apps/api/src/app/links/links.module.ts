import { Module } from '@nestjs/common';
import { LINK_REPOSITORY } from '@linkops-console/link';
import { InMemoryLinkRepository } from '@linkops-console/data-access-links';
import { LinkSeedService } from './link-seed.service';
import { TelemetrySimulatorService } from './telemetry-simulator.service';
import { LinksController } from './links.controller';
import { LinksService } from './links.service';
import { FleetController } from '../fleet/fleet.controller';

@Module({
  controllers: [LinksController, FleetController],
  providers: [
    {
      provide: LINK_REPOSITORY,
      useClass: InMemoryLinkRepository,
    },
    LinksService,
    LinkSeedService,
    TelemetrySimulatorService,
  ],
  exports: [LINK_REPOSITORY, TelemetrySimulatorService, LinksService],
})
export class LinksModule {}
