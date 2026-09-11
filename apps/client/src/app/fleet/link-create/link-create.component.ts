import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { LinkConfig } from '@linkops-console/link';
import { FleetApiService } from '../fleet-api.service';
import { LinkFormComponent } from '../link-form/link-form.component';

@Component({
  selector: 'app-link-create',
  standalone: true,
  imports: [RouterLink, LinkFormComponent],
  templateUrl: './link-create.component.html',
  styleUrl: './link-create.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkCreateComponent {
  private readonly api = inject(FleetApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly saving = signal(false);
  readonly error = signal('');

  create(config: LinkConfig): void {
    this.saving.set(true);
    this.error.set('');

    this.api
      .createLink(config)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (link) => {
          void this.router.navigate(['/links', link.id]);
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.error.set(this.messageFor(err));
        },
      });
  }

  cancel(): void {
    void this.router.navigate(['/']);
  }

  private messageFor(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 409) {
        return 'A link with that name already exists.';
      }

      if (err.status === 400) {
        return 'Some values are invalid. Check the highlighted fields and try again.';
      }
    }

    return 'Unable to create the link. Please try again.';
  }
}
