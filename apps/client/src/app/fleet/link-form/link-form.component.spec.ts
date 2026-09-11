import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { LinkConfig } from '@linkops-console/link';
import { LinkFormComponent } from './link-form.component';

const validConfig: LinkConfig = {
  name: 'Ridge-Backhaul',
  siteA: 'Ridge',
  siteB: 'Depot',
  band: '11GHz',
  mode: 'PtP',
  capacityMbps: 500,
  txPowerDbm: 12,
  channelWidthMhz: 80,
};

describe('LinkFormComponent', () => {
  let fixture: ComponentFixture<LinkFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinkFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LinkFormComponent);
    fixture.detectChanges();
  });

  it('does not emit while the form is invalid', () => {
    const emit = vi.fn();
    fixture.componentInstance.formSubmit.subscribe(emit);

    fixture.componentInstance.submit();

    expect(emit).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.name.touched).toBe(true);
  });

  it('patches the form from the value input', () => {
    fixture.componentRef.setInput('value', validConfig);
    fixture.detectChanges();

    expect(fixture.componentInstance.form.getRawValue()).toEqual(validConfig);
  });

  it('emits the typed config on a valid submit', () => {
    const emit = vi.fn();
    fixture.componentInstance.formSubmit.subscribe(emit);

    fixture.componentInstance.form.setValue(validConfig);
    fixture.componentInstance.submit();

    expect(emit).toHaveBeenCalledWith(validConfig);
  });
});
