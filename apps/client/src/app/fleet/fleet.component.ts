import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';

import { forkJoin } from 'rxjs';

import { LinkStatus } from '@linkops-console/link';

import { FleetApiService } from './fleet-api.service';

import { FleetStreamService } from './fleet-stream.service';

import { FleetSortField, FleetStore } from './fleet.store';
import { DecimalPipe, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-fleet',
  standalone: true,
  imports: [FormsModule, DecimalPipe, TitleCasePipe, RouterModule],
  templateUrl: './fleet.component.html',
  styleUrl: './fleet.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FleetComponent implements OnInit {
  readonly store = inject(FleetStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(FleetApiService);

  private readonly stream = inject(FleetStreamService);

  private readonly router = inject(Router);
  readonly statuses: Array<LinkStatus | 'all'> = [
    'all',
    'up',
    'degraded',
    'down',
  ];

  readonly loadError = signal('');
  readonly streamError = signal('');

  ngOnInit(): void {
    this.loadFleet();
    this.connectStream();
  }

  loadFleet(): void {
    this.loadError.set('');

    forkJoin({
      links: this.api.getLinks(),
      summary: this.api.getSummary(),
    }).subscribe({
      next: ({ links, summary }) => {
        this.store.setLinks(links);
        this.store.setSummary(summary);
      },
      error: (error: unknown) => {
        console.error('Failed to load fleet data', error);
        this.loadError.set(
          'Unable to load the fleet. Check your connection and try again.',
        );
      },
    });
  }

  connectStream(): void {
    this.streamError.set('');

    this.stream
      .connect()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => {
          if (event.type === 'telemetry') {
            this.store.updateTelemetry(event.sample);
          }

          if (event.type === 'status') {
            this.store.updateLink(event.linkId, {
              status: event.status,
            });
          }

          if (event.type === 'summary') {
            this.store.setSummary(event.summary);
          }
        },

        error: (error: unknown) => {
          console.error('Fleet stream error', error);
          this.streamError.set(
            'Live updates stopped. Reload the page to reconnect.',
          );
        },
      });
  }

  onSearch(value: string): void {
    this.store.setSearch(value);
    this.updateUrl();
  }

  onStatusChange(value: string): void {
    if (value === 'up' || value === 'degraded' || value === 'down') {
      this.store.setStatusFilter(value);
    } else {
      this.store.setStatusFilter('all');
    }

    this.updateUrl();
  }

  sort(field: FleetSortField): void {
    this.store.setSort(field);
    this.updateUrl();
  }

  private updateUrl(): void {
    void this.router.navigate([], {
      queryParams: {
        search: this.store.search() || null,

        status:
          this.store.statusFilter() === 'all'
            ? null
            : this.store.statusFilter(),

        sort: this.store.sortField(),

        direction: this.store.sortDirection(),
      },

      queryParamsHandling: 'merge',
    });
  }
}
