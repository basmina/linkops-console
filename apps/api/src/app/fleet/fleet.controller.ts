import { Controller, Get } from '@nestjs/common';
import { LinksService } from '../links/links.service';

@Controller('fleet')
export class FleetController {
  constructor(private readonly linksService: LinksService) {}

  @Get('summary')
  getSummary() {
    return this.linksService.getFleetSummary();
  }
}
