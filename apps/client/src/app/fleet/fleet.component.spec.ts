import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { FleetComponent } from './fleet.component';
import { FleetApiService } from './fleet-api.service';
import { FleetStreamService } from './fleet-stream.service';
import { FleetStore } from './fleet.store';

const link = {
  id: '1',
  name: 'Test Link',
  siteA: 'Site A',
  siteB: 'Site B',
  band: '5GHz' as const,
  mode: 'PtP' as const,
  capacityMbps: 100,
  txPowerDbm: 10,
  channelWidthMhz: 40 as const,
  status: 'up' as const,
  version: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const summary = {
  total: 1,
  up: 1,
  degraded: 0,
  down: 0,
  avgThroughputMbps: 70,
  worstLinkId: null,
};

describe('FleetComponent', () => {
  let fixture: ComponentFixture<FleetComponent>;

  const apiMock = {
    getLinks: vi.fn(() => of([link])),
    getSummary: vi.fn(() => of(summary)),
  };

  const streamMock = {
    connect: vi.fn(() => of()),
  };

  beforeEach(async () => {
    apiMock.getLinks.mockReturnValue(of([link]));
    apiMock.getSummary.mockReturnValue(of(summary));
    streamMock.connect.mockReturnValue(of());

    await TestBed.configureTestingModule({
      imports: [FleetComponent],
      providers: [
        FleetStore,
        {
          provide: FleetApiService,
          useValue: apiMock,
        },
        {
          provide: FleetStreamService,
          useValue: streamMock,
        },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FleetComponent);

    fixture.detectChanges();
  });

  it('should create the fleet component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('loads links from the API', () => {
    const store = TestBed.inject(FleetStore);

    expect(store.links()).toHaveLength(1);
    expect(store.links()[0].name).toBe('Test Link');
  });

  it('loads the fleet summary', () => {
    const store = TestBed.inject(FleetStore);

    expect(store.summary()).toEqual({
      total: 1,
      up: 1,
      degraded: 0,
      down: 0,
      avgThroughputMbps: 70,
      worstLinkId: null,
    });
  });

  it('renders the link name', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Test Link');
  });

  it('shows a usable message and a retry action when loading the fleet fails', () => {
    apiMock.getLinks.mockReturnValue(
      throwError(() => new Error('network down')),
    );

    fixture.componentInstance.loadFleet();
    fixture.detectChanges();

    expect(fixture.componentInstance.loadError()).toContain('Unable to load');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Unable to load the fleet');
    expect(compiled.querySelector('.retry-button')).toBeTruthy();
  });

  it('retrying a failed load clears the error once it succeeds', () => {
    apiMock.getLinks.mockReturnValueOnce(
      throwError(() => new Error('network down')),
    );

    fixture.componentInstance.loadFleet();
    expect(fixture.componentInstance.loadError()).not.toBe('');

    fixture.componentInstance.loadFleet();
    expect(fixture.componentInstance.loadError()).toBe('');
  });

  it('shows a usable message when the live stream errors', () => {
    streamMock.connect.mockReturnValue(
      throwError(() => new Error('stream closed')),
    );

    fixture.componentInstance.connectStream();
    fixture.detectChanges();

    expect(fixture.componentInstance.streamError()).toContain(
      'Live updates stopped',
    );

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Live updates stopped');
  });
});
