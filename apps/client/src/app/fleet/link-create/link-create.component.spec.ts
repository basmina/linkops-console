import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Link, LinkConfig } from '@linkops-console/link';
import { LinkCreateComponent } from './link-create.component';
import { FleetApiService } from '../fleet-api.service';

const config: LinkConfig = {
  name: 'Ridge-Backhaul',
  siteA: 'Ridge',
  siteB: 'Depot',
  band: '11GHz',
  mode: 'PtP',
  capacityMbps: 500,
  txPowerDbm: 12,
  channelWidthMhz: 80,
};

const created: Link = {
  ...config,
  id: 'new-id',
  status: 'down',
  version: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('LinkCreateComponent', () => {
  let fixture: ComponentFixture<LinkCreateComponent>;
  const apiMock = { createLink: vi.fn(() => of(created)) };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinkCreateComponent],
      providers: [
        { provide: FleetApiService, useValue: apiMock },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LinkCreateComponent);
    fixture.detectChanges();
  });

  it('navigates to the new link on success', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');

    fixture.componentInstance.create(config);

    expect(apiMock.createLink).toHaveBeenCalledWith(config);
    expect(navigate).toHaveBeenCalledWith(['/links', 'new-id']);
  });

  it('shows a duplicate-name message on 409', () => {
    apiMock.createLink.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 409 })),
    );

    fixture.componentInstance.create(config);

    expect(fixture.componentInstance.error()).toBe(
      'A link with that name already exists.',
    );
    expect(fixture.componentInstance.saving()).toBe(false);
  });
});
