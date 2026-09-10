import { Inject, Injectable, Logger } from '@nestjs/common';
import { LINK_REPOSITORY, LinkRepository } from '@linkops-console/link';
import { seedLinks } from '@linkops-console/links';

@Injectable()
export class LinkSeedService {
  private seeded = false;
  private readonly logger = new Logger(LinkSeedService.name);
  constructor(
    @Inject(LINK_REPOSITORY)
    private readonly repository: LinkRepository,
  ) {}

  async seed(): Promise<void> {
    if (this.seeded) {
      return;
    }

    const existing = await this.repository.findAll();

    if (existing.length > 0) {
      this.seeded = true;
      return;
    }

    const links = seedLinks(10);

    for (const link of links) {
      await this.repository.create(link);
    }
    this.logger.log(`Seeded ${links.length} links into the repository.`);
    this.seeded = true;
  }
}
