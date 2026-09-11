import { Injectable, computed, signal } from '@angular/core';
import {
  FleetSummary,
  Link,
  LinkStatus,
  TelemetrySample,
} from '@linkops-console/link';

export type FleetSortField = 'name' | 'status' | 'throughput' | 'capacity';

export type SortDirection = 'asc' | 'desc';
const STATUS_SEVERITY: Record<LinkStatus, number> = {
  down: 0,
  degraded: 1,
  up: 2,
};
@Injectable({
  providedIn: 'root',
})
export class FleetStore {
  readonly links = signal<Link[]>([]);

  readonly search = signal('');
  readonly statusFilter = signal<LinkStatus | 'all'>('all');

  readonly sortField = signal<FleetSortField>('name');

  readonly sortDirection = signal<SortDirection>('asc');

  readonly latestTelemetry = signal<Record<string, TelemetrySample>>({});

  readonly summary = signal<FleetSummary | null>(null);
  readonly liveStatusCounts = computed(() => {
    const links = this.links();

    return {
      total: links.length,
      up: links.filter((link) => link.status === 'up').length,
      degraded: links.filter((link) => link.status === 'degraded').length,
      down: links.filter((link) => link.status === 'down').length,
    };
  });
  setSummary(summary: FleetSummary): void {
    this.summary.set(summary);
  }
  readonly filteredLinks = computed(() => {
    const search = this.search().trim().toLowerCase();
    const status = this.statusFilter();

    return this.links()
      .filter((link) => {
        const matchesSearch =
          !search ||
          link.name.toLowerCase().includes(search) ||
          link.siteA.toLowerCase().includes(search) ||
          link.siteB.toLowerCase().includes(search);

        const matchesStatus = status === 'all' || link.status === status;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => this.compareLinks(a, b));
  });

  setLinks(links: Link[]): void {
    this.links.set(links);
  }

  updateLink(linkId: string, changes: Partial<Link>): void {
    this.links.update((links) =>
      links.map((link) =>
        link.id === linkId ? { ...link, ...changes } : link,
      ),
    );
  }

  setSearch(value: string): void {
    this.search.set(value);
  }

  setStatusFilter(value: LinkStatus | 'all'): void {
    this.statusFilter.set(value);
  }

  setSort(field: FleetSortField): void {
    if (this.sortField() === field) {
      this.sortDirection.update((direction) =>
        direction === 'asc' ? 'desc' : 'asc',
      );

      return;
    }

    this.sortField.set(field);
    this.sortDirection.set('asc');
  }

  private compareLinks(a: Link, b: Link): number {
    const field = this.sortField();

    let result = 0;

    switch (field) {
      case 'name':
        result = a.name.localeCompare(b.name);
        break;

      case 'status':
        result = STATUS_SEVERITY[a.status] - STATUS_SEVERITY[b.status];
        break;

      case 'capacity':
        result = a.capacityMbps - b.capacityMbps;
        break;

      case 'throughput': {
        const aThroughput = this.latestTelemetry()[a.id]?.throughputMbps ?? 0;
        const bThroughput = this.latestTelemetry()[b.id]?.throughputMbps ?? 0;
        result = aThroughput - bThroughput;
        break;
      }
      default: {
        const _exhaustive: never = field;
        void _exhaustive;
        result = a.name.localeCompare(b.name);
        break;
      }
    }

    return this.sortDirection() === 'asc' ? result : -result;
  }

  getTelemetry(linkId: string): TelemetrySample | undefined {
    return this.latestTelemetry()[linkId];
  }
  updateTelemetry(samples: TelemetrySample[]): void {
    this.latestTelemetry.update((current) => {
      const next = {
        ...current,
      };

      for (const sample of samples) {
        next[sample.linkId] = sample;
      }

      return next;
    });
  }
}
