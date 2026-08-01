import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  disabled,
  form,
  FormField,
  FormRoot,
  required,
  validate
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import {
  MatFormFieldAppearance,
  MatFormFieldModule
} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PhoneNumberFormat } from 'google-libphonenumber';
import {
  NgxMaterialIntlTelInputComponent,
  validPhoneNumber
} from 'ngx-material-intl-tel-input';

/** Reads a boolean query param, falling back when the param is absent. */
const flag = (value: string | undefined, fallback = false): boolean =>
  value === undefined ? fallback : value !== 'false';

/**
 * Harness page for the Playwright suite, reachable at `/e2e`.
 *
 * It renders a single component instance whose inputs come from query params
 * (bound by `withComponentInputBinding()`), so a spec can exercise any option
 * combination without the demo page's fixed configurations, its GeoIP lookup,
 * or its localized country names.
 */
@Component({
  selector: 'ngx-material-intl-tel-input-e2e-harness',
  imports: [
    NgxMaterialIntlTelInputComponent,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormRoot,
    FormField
  ],
  template: `
    @if (forms() === 'signal') {
      <form [formRoot]="signalForm">
        <ngx-material-intl-tel-input
          [formField]="signalForm.phone"
          [autoIpLookup]="false"
          [autoSelectCountry]="autoSelectCountry()"
          [autoSelectedCountry]="autoSelectedCountry()"
          [excludedCountries]="excludedCountries()"
          [useMask]="useMask()"
          [includeDialCode]="includeDialCode()"
          [showMaskPlaceholder]="showMaskPlaceholder()"
          [forceSelectedCountryCode]="forceSelectedCountryCode()"
          [numberValidation]="numberValidation()"
          [enableInputMaxLength]="enableInputMaxLength()"
          [appearance]="appearance()"
          [mainLabel]="mainLabel()"
          [initialValue]="initialValue()"
          [outputNumberFormat]="outputNumberFormat()"
        ></ngx-material-intl-tel-input>
        <button
          mat-flat-button
          type="submit"
          data-testid="signal-submit"
          [disabled]="!signalForm.phone().valid()"
          (click)="submitSignalForm()"
        >
          Submit
        </button>

        <mat-form-field>
          <mat-label>Value to set</mat-label>
          <input
            matInput
            type="text"
            data-testid="signal-set-value"
            #signalSetValue
          />
        </mat-form-field>
        <button
          mat-flat-button
          type="button"
          data-testid="signal-apply-value"
          (click)="applySignalValue(signalSetValue.value)"
        >
          Apply value
        </button>
        <button
          mat-flat-button
          type="button"
          data-testid="signal-toggle-disabled"
          (click)="signalDisabled.set(!signalDisabled())"
        >
          Toggle disabled
        </button>
        <!-- reset() clears touched/dirty only; the value needs to be passed -->
        <button
          mat-flat-button
          type="button"
          data-testid="signal-reset"
          (click)="signalForm.phone().reset()"
        >
          Reset state
        </button>
        <button
          mat-flat-button
          type="button"
          data-testid="signal-reset-value"
          (click)="signalForm.phone().reset('')"
        >
          Reset value
        </button>
      </form>
      <output data-testid="signal-value">{{ signalModel().phone }}</output>
      <output data-testid="signal-valid">{{
        signalForm.phone().valid()
      }}</output>
      <output data-testid="signal-touched">{{
        signalForm.phone().touched()
      }}</output>
      <output data-testid="signal-dirty">{{
        signalForm.phone().dirty()
      }}</output>
      <output data-testid="signal-disabled">{{
        signalForm.phone().disabled()
      }}</output>
      <output data-testid="signal-submitted">{{
        submittedSignalValue()
      }}</output>
    } @else {
      <form [formGroup]="testForm">
        <ngx-material-intl-tel-input
          fieldControlName="phone"
          [autoIpLookup]="false"
          [autoSelectCountry]="autoSelectCountry()"
          [autoSelectedCountry]="autoSelectedCountry()"
          [excludedCountries]="excludedCountries()"
          [useMask]="useMask()"
          [includeDialCode]="includeDialCode()"
          [showMaskPlaceholder]="showMaskPlaceholder()"
          [forceSelectedCountryCode]="forceSelectedCountryCode()"
          [numberValidation]="numberValidation()"
          [enableInputMaxLength]="enableInputMaxLength()"
          [appearance]="appearance()"
          [mainLabel]="mainLabel()"
          [initialValue]="initialValue()"
          [outputNumberFormat]="outputNumberFormat()"
        ></ngx-material-intl-tel-input>

        <mat-form-field>
          <mat-label>Value to set</mat-label>
          <input matInput type="text" data-testid="set-value" #setValue />
        </mat-form-field>
        <button
          mat-flat-button
          type="button"
          data-testid="apply-value"
          (click)="applyValue(setValue.value)"
        >
          Apply value
        </button>
        <button
          mat-flat-button
          type="button"
          data-testid="toggle-disabled"
          (click)="toggleDisabled()"
        >
          Toggle disabled
        </button>
        <button
          mat-flat-button
          type="button"
          data-testid="reset"
          (click)="testForm.reset()"
        >
          Reset
        </button>
      </form>
      <output data-testid="value">{{ phoneControl.value }}</output>
      <output data-testid="status">{{ phoneControl.status }}</output>
      <output data-testid="touched">{{ phoneControl.touched }}</output>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class E2eHarnessComponent {
  private readonly fb = inject(FormBuilder);

  // Query params arrive as strings, and withComponentInputBinding sets every
  // declared input to undefined when its param is absent — which would wipe a
  // `true` default. So each param is taken raw and defaulted explicitly.
  //
  // The aliases exist because the query param name and the derived signal name
  // cannot collide; this page has no public component API for the rule to
  // protect.
  /* eslint-disable @angular-eslint/no-input-rename */
  /** `?forms=signal` switches from Reactive Forms to Signal Forms */
  formsParam = input<string | undefined>(undefined, { alias: 'forms' });
  useMaskParam = input<string | undefined>(undefined, { alias: 'useMask' });
  includeDialCodeParam = input<string | undefined>(undefined, {
    alias: 'includeDialCode'
  });
  showMaskPlaceholderParam = input<string | undefined>(undefined, {
    alias: 'showMaskPlaceholder'
  });
  forceSelectedCountryCodeParam = input<string | undefined>(undefined, {
    alias: 'forceSelectedCountryCode'
  });
  numberValidationParam = input<string | undefined>(undefined, {
    alias: 'numberValidation'
  });
  enableInputMaxLengthParam = input<string | undefined>(undefined, {
    alias: 'enableInputMaxLength'
  });
  appearanceParam = input<string | undefined>(undefined, {
    alias: 'appearance'
  });
  mainLabelParam = input<string | undefined>(undefined, { alias: 'mainLabel' });
  initialValueParam = input<string | undefined>(undefined, {
    alias: 'initialValue'
  });
  /** `?outputNumberFormat=E164|RFC3966|INTERNATIONAL` */
  outputNumberFormatParam = input<string | undefined>(undefined, {
    alias: 'outputNumberFormat'
  });
  autoSelectCountryParam = input<string | undefined>(undefined, {
    alias: 'autoSelectCountry'
  });
  autoSelectedCountryParam = input<string | undefined>(undefined, {
    alias: 'autoSelectedCountry'
  });
  /** `?excludedCountries=ch,es` — comma separated ISO2 codes */
  excludedCountriesParam = input<string | undefined>(undefined, {
    alias: 'excludedCountries'
  });
  /* eslint-enable @angular-eslint/no-input-rename */

  forms = computed(() => this.formsParam() ?? 'reactive');
  useMask = computed(() => flag(this.useMaskParam()));
  includeDialCode = computed(() => flag(this.includeDialCodeParam()));
  showMaskPlaceholder = computed(() => flag(this.showMaskPlaceholderParam()));
  forceSelectedCountryCode = computed(() =>
    flag(this.forceSelectedCountryCodeParam())
  );
  numberValidation = computed(() => flag(this.numberValidationParam(), true));
  enableInputMaxLength = computed(() =>
    flag(this.enableInputMaxLengthParam(), true)
  );
  appearance = computed(
    () => (this.appearanceParam() ?? 'fill') as MatFormFieldAppearance
  );
  mainLabel = computed(() => this.mainLabelParam() ?? '');
  initialValue = computed(() => this.initialValueParam() ?? '');
  autoSelectCountry = computed(() => flag(this.autoSelectCountryParam(), true));
  autoSelectedCountry = computed(() => this.autoSelectedCountryParam() ?? '');
  excludedCountries = computed(() =>
    (this.excludedCountriesParam() ?? '').split(',').filter(Boolean)
  );
  outputNumberFormat = computed(() => {
    switch (this.outputNumberFormatParam()) {
      case 'E164':
        return PhoneNumberFormat.E164;
      case 'RFC3966':
        return PhoneNumberFormat.RFC3966;
      default:
        return PhoneNumberFormat.INTERNATIONAL;
    }
  });

  testForm = this.fb.group({
    phone: ['', [Validators.required]]
  });

  /** drives the schema-level `disabled` rule, not the component input */
  signalDisabled = signal(false);
  signalModel = signal({ phone: '' });
  signalForm = form(this.signalModel, (path) => {
    required(path.phone);
    disabled(path.phone, { when: () => this.signalDisabled() });
    validate(path.phone, validPhoneNumber);
  });
  submittedSignalValue = signal<string>('');

  get phoneControl() {
    return this.testForm.controls.phone;
  }

  /** Writes a value to the control from outside the component. */
  applyValue(value: string): void {
    this.phoneControl.setValue(value);
  }

  toggleDisabled(): void {
    if (this.phoneControl.disabled) {
      this.phoneControl.enable();
    } else {
      this.phoneControl.disable();
    }
  }

  submitSignalForm(): void {
    this.submittedSignalValue.set(this.signalModel().phone);
  }

  /** Writes a value into the model signal the field is built from. */
  applySignalValue(value: string): void {
    this.signalModel.set({ phone: value });
  }
}
