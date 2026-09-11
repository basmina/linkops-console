import { TestBed } from '@angular/core/testing';

import { Link, TelemetrySample } from '@linkops-console/link';

import { FleetStore } from './fleet.store';

describe('FleetStore', () => {
  let store: FleetStore;

  const links: Link[] = [
    {
      id: '1',
      name: 'Alpha',
      siteA: 'Chennai',
      siteB: 'Bangalore',
      band: '5GHz',
      mode: 'PtP',
      capacityMbps: 100,
      txPowerDbm: 10,
      channelWidthMhz: 40,
      status: 'up',
      version: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      name: 'Beta',
      siteA: 'Delhi',
      siteB: 'Mumbai',
      band: '11GHz',
      mode: 'PtMP',
      capacityMbps: 500,
      txPowerDbm: 15,
      channelWidthMhz: 80,
      status: 'degraded',
      version: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: '3',
      name: 'Gamma',
      siteA: 'Pune',
      siteB: 'Hyderabad',
      band: '24GHz',
      mode: 'S2S',
      capacityMbps: 200,
      txPowerDbm: 5,
      channelWidthMhz: 20,
      status: 'down',
      version: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FleetStore],
    });

    store = TestBed.inject(FleetStore);
    store.setLinks(links);
  });

  it('stores and exposes links', () => {
    expect(store.links()).toHaveLength(3);
  });

  it('filters links by search text', () => {
    store.setSearch('alpha');

    expect(store.filteredLinks()).toHaveLength(1);
    expect(store.filteredLinks()[0].name).toBe('Alpha');
  });

  it('filters links by status', () => {
    store.setStatusFilter('degraded');

    expect(store.filteredLinks()).toHaveLength(1);
    expect(store.filteredLinks()[0].name).toBe('Beta');
  });

  it('sorts links by capacity', () => {
    store.setSort('capacity');

    expect(store.filteredLinks().map((link) => link.capacityMbps)).toEqual([
      100, 200, 500,
    ]);
  });

  it('reverses sort direction when selecting the same field', () => {
    store.setSort('capacity');
    store.setSort('capacity');

    expect(store.filteredLinks().map((link) => link.capacityMbps)).toEqual([
      500, 200, 100,
    ]);
  });

  it('updates a link status', () => {
    store.updateLink('3', {
      status: 'up',
    });

    expect(store.links()[2].status).toBe('up');
  });

  it('stores latest telemetry by link id', () => {
    const samples: TelemetrySample[] = [
      {
        linkId: '1',
        ts: '2026-01-01T00:00:01.000Z',
        rssiDbm: -50,
        snrDb: 25,
        throughputMbps: 80,
      },
      {
        linkId: '2',
        ts: '2026-01-01T00:00:01.000Z',
        rssiDbm: -65,
        snrDb: 15,
        throughputMbps: 120,
      },
    ];

    store.updateTelemetry(samples);

    expect(store.getTelemetry('1')?.throughputMbps).toBe(80);

    expect(store.getTelemetry('2')?.snrDb).toBe(15);
  });

  it('updates fleet summary', () => {
    const summary = {
      total: 3,
      up: 1,
      degraded: 1,
      down: 1,
      avgThroughputMbps: 100,
      worstLinkId: '3',
    };

    store.setSummary(summary);

    expect(store.summary()).toEqual(summary);
  });
});
