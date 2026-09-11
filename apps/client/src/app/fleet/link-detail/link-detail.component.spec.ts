import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Link, LinkConfig } from '@linkops-console/link';
import { LinkDetailComponent } from './link-detail.component';
import { FleetApiService } from '../fleet-api.service';
import { FleetStreamService } from '../fleet-stream.service';

const link: Link = {
  id: '1',
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
};

const config: LinkConfig = {
  name: 'Updated Link',
  siteA: 'Site A',
  siteB: 'Site B',
  band: '5GHz',
  mode: 'PtP',
  capacityMbps: 100,
  txPowerDbm: 10,
  channelWidthMhz: 40,
};

describe('LinkDetailComponent', () => {
  let fixture: ComponentFixture<LinkDetailComponent>;

  const apiMock = {
    getLink: () => of(link),
    getTelemetry: () => of([]),
    updateLink: vi.fn(() => of(link)),
  };

  const streamMock = {
    connect: () => of(),
  };

  beforeEach(async () => {
    apiMock.getLink = () => of(link);

    await TestBed.configureTestingModule({
      imports: [LinkDetailComponent],
      providers: [
        { provide: FleetApiService, useValue: apiMock },
        { provide: FleetStreamService, useValue: streamMock },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LinkDetailComponent);
    fixture.detectChanges();
  });

  it('should create the link detail component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('sends the current version when saving', () => {
    fixture.componentInstance.link.set(link);

    fixture.componentInstance.save(config);

    expect(apiMock.updateLink).toHaveBeenCalledWith('1', {
      ...config,
      version: 1,
    });
  });

  it('shows a conflict when saving a stale link version', () => {
    fixture.componentInstance.link.set(link);

    vi.mocked(apiMock.updateLink).mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: {
              error: {
                code: 'LINK_VERSION_CONFLICT',
                message: 'Link was modified by someone else',
                details: { currentVersion: 2 },
              },
            },
          }),
      ),
    );

    fixture.componentInstance.save(config);

    expect(fixture.componentInstance.hasConflict()).toBe(true);
    expect(fixture.componentInstance.saveError()).toContain(
      'modified by someone else',
    );
  });

  it('reloadLink refetches the link and clears the conflict', () => {
    fixture.componentInstance.link.set(link);

    vi.mocked(apiMock.updateLink).mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 409, error: {} })),
    );

    fixture.componentInstance.save(config);
    expect(fixture.componentInstance.hasConflict()).toBe(true);

    const latest = { ...link, name: 'Renamed By Someone Else', version: 2 };
    apiMock.getLink = () => of(latest);

    fixture.componentInstance.reloadLink();

    expect(fixture.componentInstance.hasConflict()).toBe(false);
    expect(fixture.componentInstance.saveError()).toBe('');
    expect(fixture.componentInstance.link()).toEqual(latest);
  });
});
