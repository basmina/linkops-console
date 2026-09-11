import { DecimalPipe, TitleCasePipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  DestroyRef,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Link, LinkConfig, TelemetrySample } from '@linkops-console/link';
import { FleetApiService } from '../fleet-api.service';
import { FleetStreamService } from '../fleet-stream.service';
import { LinkFormComponent } from '../link-form/link-form.component';
import { catchError, forkJoin, of, timer } from 'rxjs';

@Component({
  selector: 'app-link-detail',
  standalone: true,
  imports: [
    RouterModule,
    DecimalPipe,
    TitleCasePipe,
    DatePipe,
    LinkFormComponent,
  ],
  templateUrl: './link-detail.component.html',
  styleUrl: './link-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(FleetApiService);
  private readonly stream = inject(FleetStreamService);
  private readonly destroyRef = inject(DestroyRef);

  readonly link = signal<Link | null>(null);
  readonly telemetry = signal<TelemetrySample[]>([]);
  readonly latest = signal<TelemetrySample | null>(null);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly saveError = signal('');
  readonly saved = signal(false);

  readonly hasConflict = signal(false);
  readonly statusLabel = computed(() => this.link()?.status ?? 'down');
  readonly sparklinePoints = computed(() => {
    const samples = this.telemetry().slice(-60);

    if (samples.length === 0) {
      return '';
    }

    const values = samples.map((sample) => sample.throughputMbps);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = Math.max(max - min, 1);
    return values
      .map((value, index) => {
        const x =
          samples.length === 1 ? 0 : (index / (samples.length - 1)) * 400;
        const y = 100 - ((value - min) / range) * 90;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Link ID is missing.');
      this.loading.set(false);
      return;
    }
    this.load(id);
    this.connectStream(id);
  }

  save(config: LinkConfig): void {
    const currentLink = this.link();
    if (!currentLink) {
      return;
    }
    this.saving.set(true);
    this.saveError.set('');
    this.saved.set(false);
    this.api
      .updateLink(currentLink.id, { ...config, version: currentLink.version })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.link.set(updated);
          this.saving.set(false);
          this.saved.set(true);
          timer(2000)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
              this.saved.set(false);
            });
        },
        error: (err: unknown) => {
          this.saving.set(false);

          if (err instanceof HttpErrorResponse && err.status === 409) {
            this.hasConflict.set(true);
            this.saveError.set(
              'This link was modified by someone else. Reload it to see the latest version, then try again.',
            );
            return;
          }
          this.saveError.set('Unable to save the link. Please try again.');
        },
      });
  }

  reloadLink(): void {
    const id = this.link()?.id;

    if (!id) {
      return;
    }

    this.api
      .getLink(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (latest) => {
          this.link.set(latest);
          this.hasConflict.set(false);
          this.saveError.set('');
        },
        error: () => {
          this.saveError.set(
            'Unable to reload the latest version. Please try again.',
          );
        },
      });
  }

  cancelEdit(): void {
    void this.router.navigate(['/']);
  }

  delete(): void {
    const currentLink = this.link();
    if (!currentLink) {
      return;
    }
    const confirmed = window.confirm(
      `Delete "${currentLink.name}"? This action cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }
    this.api
      .deleteLink(currentLink.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          void this.router.navigate(['/']);
        },
        error: () => {
          this.error.set('Unable to delete the link. Please try again.');
        },
      });
  }

  private load(id: string): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      link: this.api.getLink(id),
      telemetry: this.api
        .getTelemetry(id)
        .pipe(catchError(() => of([] as TelemetrySample[]))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ link, telemetry }) => {
          this.link.set(link);
          this.telemetry.set(telemetry);
          this.latest.set(
            telemetry.length > 0 ? telemetry[telemetry.length - 1] : null,
          );
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Unable to load this link.');
          this.loading.set(false);
        },
      });
  }

  private connectStream(id: string): void {
    this.stream
      .connect()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => {
          if (event.type === 'telemetry') {
            const sample = event.sample.find((item) => item.linkId === id);
            if (!sample) {
              return;
            }
            this.latest.set(sample);
            this.telemetry.update((samples) => [...samples.slice(-59), sample]);
            return;
          }
          if (event.type === 'status' && event.linkId === id) {
            this.link.update((current) =>
              current ? { ...current, status: event.status } : current,
            );
          }
        },
        error: () => {
          // EventSource reconnects automatically.
        },
      });
  }
}
