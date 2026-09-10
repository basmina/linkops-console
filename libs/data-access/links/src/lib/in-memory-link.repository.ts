import { Link, LinkRepository } from '@linkops-console/link';

export class InMemoryLinkRepository implements LinkRepository {
  private readonly links = new Map<string, Link>();

  async findAll(): Promise<Link[]> {
    return Array.from(this.links.values());
  }

  async findById(id: string): Promise<Link | undefined> {
    return this.links.get(id);
  }

  async create(link: Link): Promise<Link> {
    this.links.set(link.id, link);
    return link;
  }

  async update(link: Link): Promise<Link> {
    this.links.set(link.id, link);
    return link;
  }

  async delete(id: string): Promise<void> {
    this.links.delete(id);
  }
}
