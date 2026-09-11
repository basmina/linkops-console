import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  BANDS,
  CHANNEL_WIDTHS,
  LINK_LIMITS,
  LinkConfig,
  MODES,
} from '@linkops-console/link';

@Component({
  selector: 'app-link-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './link-form.component.html',
  styleUrl: './link-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly value = input<LinkConfig | null>(null);
  readonly pending = input(false);
  readonly errorMessage = input('');
  readonly submitLabel = input('Save');

  readonly formSubmit = output<LinkConfig>();
  readonly formCancel = output<void>();

  readonly bands = BANDS;
  readonly modes = MODES;
  readonly channelWidths = CHANNEL_WIDTHS;

  readonly form = this.fb.nonNullable.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(LINK_LIMITS.nameMinLength),
        Validators.maxLength(LINK_LIMITS.nameMaxLength),
      ],
    ],
    siteA: ['', Validators.required],
    siteB: ['', Validators.required],
    band: [BANDS[0], Validators.required],
    mode: [MODES[0], Validators.required],
    capacityMbps: [
      100,
      [
        Validators.required,
        Validators.min(LINK_LIMITS.capacityMbpsMin),
        Validators.max(LINK_LIMITS.capacityMbpsMax),
      ],
    ],
    txPowerDbm: [
      10,
      [
        Validators.required,
        Validators.min(LINK_LIMITS.txPowerDbmMin),
        Validators.max(LINK_LIMITS.txPowerDbmMax),
      ],
    ],
    channelWidthMhz: [CHANNEL_WIDTHS[0], Validators.required],
  });

  constructor() {
    effect(() => {
      const value = this.value();

      if (value) {
        this.form.patchValue(value);
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.formSubmit.emit(this.form.getRawValue());
  }
}
