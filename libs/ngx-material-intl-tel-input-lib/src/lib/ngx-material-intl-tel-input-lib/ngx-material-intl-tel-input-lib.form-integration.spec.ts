import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  apply,
  debounce,
  form,
  FormField,
  required
} from '@angular/forms/signals';
import { NgxMaterialIntlTelInputComponent } from './ngx-material-intl-tel-input-lib.component';
import { telephoneNumberSchema } from '../validators/telephone-number.schema';

@Component({
  imports: [FormField, NgxMaterialIntlTelInputComponent],
  template: `
    <ngx-material-intl-tel-input
      [formField]="phoneForm.phone"
      [autoIpLookup]="false"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
class SignalFormsHostComponent {
  readonly phoneModel = signal({ phone: '' });
  readonly phoneForm = form(this.phoneModel, (path) => {
    required(path.phone);
    apply(path.phone, telephoneNumberSchema());
  });
}

@Component({
  imports: [FormField, NgxMaterialIntlTelInputComponent],
  template: ` <ngx-material-intl-tel-input [formField]="phoneForm.phone" /> `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
class DebouncedSignalFormsHostComponent {
  readonly phoneModel = signal({ phone: '' });
  readonly phoneForm = form(this.phoneModel, (path) => {
    debounce(path.phone, 'blur');
  });
}

@Component({
  imports: [ReactiveFormsModule, NgxMaterialIntlTelInputComponent],
  template: `
    <form [formGroup]="phoneForm">
      <ngx-material-intl-tel-input formControlName="phone" />
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
class ReactiveFormsHostComponent {
  readonly phoneForm = new FormGroup({
    phone: new FormControl('', { nonNullable: true })
  });
}

@Component({
  imports: [ReactiveFormsModule, NgxMaterialIntlTelInputComponent],
  template: ` <ngx-material-intl-tel-input [formControl]="phoneControl" /> `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
class DirectReactiveFormsHostComponent {
  readonly phoneControl = new FormControl('', { nonNullable: true });
}

@Component({
  imports: [ReactiveFormsModule, NgxMaterialIntlTelInputComponent],
  template: `
    <form [formGroup]="phoneForm">
      <ngx-material-intl-tel-input fieldControlName="phone" />
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
class LegacyFormsHostComponent {
  readonly phoneForm = new FormGroup({
    phone: new FormControl('', { nonNullable: true })
  });
}

@Component({
  imports: [FormField, NgxMaterialIntlTelInputComponent],
  template: `
    <ngx-material-intl-tel-input
      [formField]="phoneForm.phone"
      [fieldControl]="legacyControl"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
class ConflictingFormsHostComponent {
  readonly phoneModel = signal({ phone: '' });
  readonly phoneForm = form(this.phoneModel);
  readonly legacyControl = new FormControl('');
}

describe('NgxMaterialIntlTelInputComponent form integration', () => {
  it('synchronizes Signal Forms in both directions and resets', async () => {
    const fixture = TestBed.createComponent(SignalFormsHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const input = getTelephoneInput(fixture);

    fixture.componentInstance.phoneForm.phone().value.set('+34 612 34 56 78');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(input.value()).toBe('+34 612 34 56 78');

    input.value.set('+44 20 7946 0958');
    await fixture.whenStable();

    expect(fixture.componentInstance.phoneModel().phone).toBe(
      '+44 20 7946 0958'
    );

    input.reset();
    await fixture.whenStable();

    expect(fixture.componentInstance.phoneModel().phone).toBe('');
  });

  it('does not duplicate the dial code while the user types', async () => {
    const fixture = TestBed.createComponent(SignalFormsHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const input = getTelephoneInput(fixture);
    const emittedValues: string[] = [];
    input.currentValue.subscribe((value) => emittedValues.push(value));
    const numberInput = fixture.nativeElement.querySelector(
      'input[type="tel"]'
    ) as HTMLInputElement;

    for (const partialValue of ['6', '61', '612', '6123']) {
      numberInput.value = partialValue;
      numberInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(numberInput.value).not.toContain('+34');
    }

    expect(fixture.componentInstance.phoneModel().phone).toBe('+34 6123');
    expect(emittedValues).toHaveLength(4);

    const debouncedFixture = TestBed.createComponent(
      DebouncedSignalFormsHostComponent
    );
    debouncedFixture.detectChanges();
    await debouncedFixture.whenStable();
    const debouncedInput = getTelephoneInput(debouncedFixture);
    const nativeInput = debouncedFixture.nativeElement.querySelector(
      'input[type="tel"]'
    ) as HTMLInputElement;

    nativeInput.value = '612';
    nativeInput.dispatchEvent(new Event('input'));
    debouncedFixture.detectChanges();
    await debouncedFixture.whenStable();

    expect(debouncedFixture.componentInstance.phoneModel().phone).toBe('');

    debouncedInput.onHostFocusOut();
    await debouncedFixture.whenStable();

    expect(debouncedFixture.componentInstance.phoneModel().phone).toBe(
      '+34 612'
    );
  });

  it('receives required validation and touched state from Signal Forms', async () => {
    const fixture = TestBed.createComponent(SignalFormsHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const input = getTelephoneInput(fixture);
    const nativeInput = fixture.nativeElement.querySelector(
      'input[type="tel"]'
    ) as HTMLInputElement;

    expect(input.required()).toBe(true);
    expect(input.hasControlError('required')).toBe(true);
    expect(fixture.nativeElement.querySelector('mat-error')).toBeNull();

    input.focus();
    expect(document.activeElement).toBe(nativeInput);

    input.onHostFocusOut();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.phoneForm.phone().touched()).toBe(true);
    expect(
      fixture.nativeElement.querySelector('mat-error').textContent
    ).toContain('This field is required');
  });

  it('supports standard and legacy Reactive Forms bindings', async () => {
    const fixture = TestBed.createComponent(ReactiveFormsHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const input = getTelephoneInput(fixture);

    input.value.set('+34 61');
    await fixture.whenStable();

    expect(fixture.componentInstance.phoneForm.controls.phone.invalid).toBe(
      true
    );

    input.value.set('+34 612 34 56 78');
    await fixture.whenStable();

    expect(fixture.componentInstance.phoneForm.controls.phone.value).toBe(
      '+34 612 34 56 78'
    );
    expect(fixture.componentInstance.phoneForm.controls.phone.valid).toBe(true);

    const directFixture = TestBed.createComponent(
      DirectReactiveFormsHostComponent
    );
    directFixture.detectChanges();
    await directFixture.whenStable();
    const directInput = getTelephoneInput(directFixture);

    directFixture.componentInstance.phoneControl.setValue('+44 20 7946 0958');
    directFixture.detectChanges();
    await directFixture.whenStable();

    expect(directInput.value()).toBe('+44 20 7946 0958');

    const legacyFixture = TestBed.createComponent(LegacyFormsHostComponent);
    legacyFixture.detectChanges();
    await legacyFixture.whenStable();
    const legacyInput = getTelephoneInput(legacyFixture);

    legacyFixture.componentInstance.phoneForm.controls.phone.setValue(
      '+34 612 34 56 78'
    );
    await legacyFixture.whenStable();

    expect(legacyInput.telForm.controls.numberControl.value).toBe(
      '612 34 56 78'
    );
  });

  it('rejects native and legacy form bindings on the same component', () => {
    expect(() => {
      const fixture = TestBed.createComponent(ConflictingFormsHostComponent);
      fixture.detectChanges();
    }).toThrow(/accepts only one form binding/);
  });
});

function getTelephoneInput<T>(
  fixture: ComponentFixture<T>
): NgxMaterialIntlTelInputComponent {
  return fixture.debugElement.query(
    (debugElement) =>
      debugElement.componentInstance instanceof NgxMaterialIntlTelInputComponent
  ).componentInstance as NgxMaterialIntlTelInputComponent;
}
