import { InMemoryLinkRepository } from './in-memory-link.repository';
import { Link } from '@linkops-console/link';

describe('InMemoryLinkRepository', () => {
  let repository: InMemoryLinkRepository;

  function makeLink(overrides: Partial<Link> = {}): Link {
    return {
      id: 'link-1',
      name: 'Test Link',
      siteA: 'Site A',
      siteB: 'Site B',
      band: '5GHz',
      mode: 'PtP',
      capacityMbps: 100,
      txPowerDbm: 10,
      channelWidthMhz: 40,
      status: 'up',
      version: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      ...overrides,
    };
  }

  beforeEach(() => {
    repository = new InMemoryLinkRepository();
  });

  it('returns an empty array when no links exist', async () => {
    expect(await repository.findAll()).toEqual([]);
  });

  it('creates and finds a link by id', async () => {
    const link = makeLink();
    await repository.create(link);
    expect(await repository.findById('link-1')).toEqual(link);
  });

  it('returns undefined when finding a non-existent id', async () => {
    expect(await repository.findById('missing')).toBeUndefined();
  });

  it('update() overwrites the stored link with the given entity', async () => {
    await repository.create(makeLink());
    const updated = await repository.update(makeLink({ name: 'Renamed Link' }));
    expect(updated.name).toBe('Renamed Link');
  });

  it('deletes an existing link', async () => {
    await repository.create(makeLink());
    await repository.delete('link-1');
    expect(await repository.findById('link-1')).toBeUndefined();
  });
});
