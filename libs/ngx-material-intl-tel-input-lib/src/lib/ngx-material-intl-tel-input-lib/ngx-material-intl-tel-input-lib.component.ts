import { AsyncPipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  OnInit,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild
} from '@angular/core';
import {
  AbstractControl,
  ControlContainer,
  FormControl,
  FormControlStatus,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import type { FormValueControl } from '@angular/forms/signals';
import {
  MAT_SELECT_CONFIG,
  MatSelect,
  MatSelectModule
} from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Observable, ReplaySubject, Subject, take, takeUntil } from 'rxjs';
import { CountryCode } from '../data/country-code';
import { Country } from '../types/country.model';
import {
  PhoneNumber,
  PhoneNumberFormat,
  PhoneNumberUtil
} from 'google-libphonenumber';
import {
  MatFormFieldAppearance,
  MatFormFieldModule
} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import TelValidators from '../validators/tel.validators';
import { GeoIpService } from '../services/geo-ip/geo-ip.service';
import { GeoData } from '../types/geo.type';
import { TextLabels } from '../types/text-labels.type';
import { CountryISO } from '../enums/country-iso.enum';
import { CountryDataService } from '../services/country-data/country-data.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IMaskModule } from 'angular-imask';
import { phoneNumberUtils } from '../utils/phone-number.utils';
import { caretUtils } from '../utils/caret.utils';
import { countryUtils } from '../utils/country.utils';
import { PhoneIconComponent } from '../components/phone-icon/phone-icon.component';

@Component({
  selector: 'ngx-material-intl-tel-input',
  templateUrl: './ngx-material-intl-tel-input-lib.component.html',
  styleUrl: './ngx-material-intl-tel-input-lib.component.scss',
  imports: [
    AsyncPipe,
    MatSelectModule,
    NgxMatSelectSearchModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    PhoneIconComponent,
    IMaskModule
  ],
  providers: [
    CountryCode,
    {
      provide: MAT_SELECT_CONFIG,
      useValue: { overlayPanelClass: 'tel-mat-select-pane' }
    },
    GeoIpService,
    CountryDataService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgxMaterialIntlTelInputComponent
  implements OnInit, AfterViewInit, OnDestroy, FormValueControl<string>
{
  private readonly countryCodeData = inject(CountryCode);
  private readonly geoIpService = inject(GeoIpService);
  private readonly countryDataService = inject(CountryDataService);
  private readonly controlContainer = inject(ControlContainer, {
    optional: true
  });
  private readonly injector = inject(Injector);

  /** control for the selected country prefix */
  public prefixCtrl: FormControl<Country | null> =
    new FormControl<Country | null>(null);

  /** control for the MatSelect filter keyword */
  public prefixFilterCtrl: FormControl<string | null> = new FormControl<
    string | null
  >('');

  /** list of countries filtered by search keyword */
  public filteredCountries: ReplaySubject<Country[]> = new ReplaySubject<
    Country[]
  >(1);

  singleSelect = viewChild<MatSelect>('singleSelect');
  numberInput = viewChild<ElementRef>('numberInput');

  /** Subject that emits when the component has been destroyed. */
  protected _onDestroy = new Subject<void>();

  private initialTelValueTimeout?: ReturnType<typeof setTimeout>;

  allCountries: Country[] = [];
  phoneNumberUtil = PhoneNumberUtil.getInstance();

  /** where the value currently being applied came from: the number input
   * itself, or a write from outside the component */
  private valueUpdateSource: 'input' | 'external' = 'external';

  telForm = new FormGroup({
    prefixCtrl: this.prefixCtrl,
    numberControl: new FormControl('')
  });

  /** two-way value binding used by Signal Forms via the [formField] directive */
  value = model<string>('');
  /** marks the Signal Forms field as touched on blur */
  touch = output<void>();
  fieldControl = model<
    FormControl | AbstractControl<string | null, string | null> | null
  >(new FormControl(''));
  fieldControlName = input<string>('');
  required = model<boolean>(false);
  disabled = model<boolean>(false);
  appearance = input<MatFormFieldAppearance>('fill');
  enablePlaceholder = input<boolean>(true);
  autoIpLookup = input<boolean>(false);
  autoSelectCountry = input<boolean>(true);
  autoSelectedCountry = input<CountryISO | string>('');
  numberValidation = input<boolean>(true);
  iconMakeCall = input<boolean>(true);
  initialValue = model<string>('');
  enableSearch = input<boolean>(true);
  includeDialCode = input<boolean>(false);
  emojiFlags = input<boolean>(false);
  hidePhoneIcon = input<boolean>(false);
  localizeCountryNames = input<boolean>(false);
  preferredCountries = input<(CountryISO | string)[]>([]);
  visibleCountries = input<(CountryISO | string)[]>([]);
  excludedCountries = input<(CountryISO | string)[]>([]);
  textLabels = input<TextLabels>({
    mainLabel: 'Phone number',
    codePlaceholder: 'Code',
    searchPlaceholderLabel: 'Search',
    noEntriesFoundLabel: 'No countries found',
    nationalNumberLabel: '',
    hintLabel: 'Select country and type your phone number',
    invalidNumberError: 'Number is not valid',
    requiredError: 'This field is required',
    numberTooLongError: 'Phone number is too long'
  });
  mainLabel = input<string>('');
  useMask = input<boolean>(false);
  forceSelectedCountryCode = input<boolean>(false);
  showMaskPlaceholder = input<boolean>(false);
  outputNumberFormat = input<
    | PhoneNumberFormat.E164
    | PhoneNumberFormat.INTERNATIONAL
    | PhoneNumberFormat.RFC3966
  >(PhoneNumberFormat.INTERNATIONAL);
  enableInputMaxLength = input<boolean>(true);
  currentValue = output<string>();
  currentCountryCode = output<string>();
  currentCountryISO = output<string>();
  isFocused = signal<boolean>(false);
  isLoading = signal<boolean>(true);
  resolvedMainLabel = computed(
    () => this.mainLabel() || this.textLabels().mainLabel
  );
  isOutlineWithLabel = computed(
    () => this.appearance() === 'outline' && !!this.resolvedMainLabel()
  );

  constructor() {
    effect(() => {
      this.setRequiredValidators();
      this.setDisabledState();
    });
    effect(() => {
      const value = this.value();
      if (value !== (this.fieldControl()?.value ?? '')) {
        this.fieldControl()?.setValue(value);
      }
    });
  }

  /**
   * Initialize the component and perform necessary setup tasks.
   *
   */
  ngOnInit(): void {
    this.setFieldControl();
    this.fetchCountryData();
    this.addValidations();
    // load the initial countries list
    this.filteredCountries.next(this.allCountries.slice());
    // listen for search field value changes
    this.prefixFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterCountries();
      });
    this.startTelFormValueChangesListener();
    this.startPrefixValueChangesListener();
    this.initialTelValueTimeout = setTimeout(() => {
      this.setInitialTelValue();
    });
    this.startFieldControlValueChangesListener();
    this.startFieldControlStatusChangesListener();
  }

  /**
   * Fetches country data and populates the allCountries array.
   */
  protected fetchCountryData(): void {
    const processedCountries = this.countryDataService.processCountries(
      this.countryCodeData,
      this.enablePlaceholder(),
      this.includeDialCode(),
      this.visibleCountries(),
      this.preferredCountries(),
      this.excludedCountries(),
      this.useMask(),
      this.forceSelectedCountryCode(),
      this.showMaskPlaceholder(),
      this.outputNumberFormat(),
      this.localizeCountryNames()
    );
    this.allCountries = processedCountries;
  }

  /**
   * Adds validations to the form field based on the current configuration.
   * It sets required validators and disabled state, and if number validation is enabled,
   * it adds a custom validator to check the validity of the phone number.
   */
  private addValidations(): void {
    this.setRequiredValidators();
    this.setDisabledState();
    if (this.numberValidation()) {
      this.fieldControl()?.addValidators(
        TelValidators.isValidNumber(
          this.telForm,
          this.includeDialCode(),
          this.allCountries
        )
      );
    }
  }

  /**
   * Sets the required validators for the field control based on the 'required' input property.
   * If 'required' is true, adds a 'Validators.required' validator to the field control.
   * If 'required' is false, removes the 'Validators.required' validator from the field control.
   */
  setRequiredValidators(): void {
    if (this.required()) {
      this.fieldControl()?.addValidators(Validators.required);
    } else {
      this.fieldControl()?.removeValidators(Validators.required);
    }
  }

  /**
   * Sets the disabled state of the telForm and fieldControl based on the 'disabled' input property.
   * If 'disabled' is true, both telForm and fieldControl are disabled.
   * If 'disabled' is false, both telForm and fieldControl are enabled.
   */
  setDisabledState(): void {
    if (this.disabled()) {
      this.telForm?.disable();
      this.fieldControl()?.disable();
    } else {
      this.telForm?.enable();
      this.fieldControl()?.enable();
    }
  }

  /**
   * A lifecycle hook that is called after Angular has fully initialized a component's view.
   *
   * @return {void}
   */
  ngAfterViewInit(): void {
    this.setInitialPrefixValue();
  }

  /**
   * Method called when the component is destroyed.
   *
   */
  ngOnDestroy(): void {
    clearTimeout(this.initialTelValueTimeout);
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  /**
   * Performs a geo IP lookup and sets the prefix control value based on the country retrieved.
   */
  private geoIpLookup(): void {
    this.geoIpService.geoIpLookup().subscribe({
      next: (data: GeoData) => {
        const country =
          this.allCountries?.find(
            (c) => c.iso2 === data.country_code?.toLowerCase()
          ) || null;
        if (country) {
          this.prefixCtrl.setValue(country);
        } else {
          this.setAutoSelectedCountry();
        }
      },
      error: () => {
        this.setAutoSelectedCountry();
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Sets the initial value after the filteredCountries are loaded initially
   */
  protected setInitialPrefixValue(): void {
    this.filteredCountries
      .pipe(take(1), takeUntil(this._onDestroy))
      .subscribe(() => {
        // setting the compareWith property to a comparison function
        // triggers initializing the selection according to the initial value of
        // the form control (i.e. _initializeSelection())
        // this needs to be done after the filteredCountries are loaded initially
        // and after the mat-option elements are available
        const singleSelectInstance = this.singleSelect() as MatSelect;
        if (singleSelectInstance) {
          singleSelectInstance.compareWith = (a: Country, b: Country) =>
            a && b && a.iso2 === b.iso2;
        }
      });
  }

  /**
   * Method to filter the list of countries based on a search keyword.
   *
   */
  protected filterCountries(): void {
    if (!this.allCountries) {
      return;
    }
    // get the search keyword
    const normalizedSearch = this.normalizeSearchValue(
      this.prefixFilterCtrl.value
    );
    if (!normalizedSearch) {
      this.filteredCountries.next(this.allCountries.slice());
      return;
    }
    // filter the countries
    this.filteredCountries.next(
      this.allCountries.filter(
        (country) =>
          this.normalizeSearchValue(country?.name).indexOf(normalizedSearch) >
          -1
      )
    );
  }

  /**
   * Normalizes the search value by trimming whitespace, converting to lowercase,
   * and removing diacritics.
   *
   * @param value - The value to normalize.
   * @return The normalized value.
   */
  private normalizeSearchValue(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    let normalizedValue = value.toString().trim().toLocaleLowerCase();
    try {
      normalizedValue = normalizedValue.normalize('NFD');
    } catch {
      // ignore if normalize is not supported in the current environment
    }
    return normalizedValue.replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * A method that handles the focus event for the input.
   *
   */
  onInputFocus(): void {
    this.isFocused.set(true);
  }

  /**
   * A method that handles the blur event for the input.
   *
   * Both forms APIs are notified: `touch` for the Signal Forms field, and
   * `markAsTouched` for the Reactive Forms control, which otherwise never
   * leaves its untouched state — the component already propagates dirty the
   * same way.
   */
  onInputBlur(): void {
    this.isFocused.set(false);
    this.touch.emit();
    this.fieldControl()?.markAsTouched();
  }

  /**
   * Listens for changes in the telForm value and updates the fieldControl accordingly.
   */
  private startTelFormValueChangesListener(): void {
    this.telForm.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe((data) => {
        const inputElement = this.numberInput()?.nativeElement;
        if (data?.numberControl) {
          const cursorPosition = inputElement?.selectionStart;
          const currentValue = data.numberControl;
          this.fieldControl()?.markAsDirty();
          // a value already starting with '+' carries its own dial code
          // (typed or pasted international number), so prefixing the selected
          // country's code would build an unparseable '+34+41...'
          const isInternationalEntry = data.numberControl
            .trim()
            .startsWith('+');
          const value =
            data?.prefixCtrl?.dialCode &&
            !this.includeDialCode() &&
            !isInternationalEntry
              ? '+' + data.prefixCtrl.dialCode + data.numberControl
              : data.numberControl;
          try {
            const parsed = this.phoneNumberUtil.parse(
              value,
              data?.prefixCtrl?.iso2
            );
            const formatted = this.phoneNumberUtil.format(
              parsed,
              this.outputNumberFormat()
            );
            this.setFieldControlValue(formatted);
            this.setCursorPosition(
              inputElement,
              cursorPosition,
              parsed,
              currentValue
            );
          } catch {
            this.setFieldControlValue(value);
          }
        } else {
          this.setFieldControlValue('');
        }
      });
  }

  /**
   * Sets the fieldControl value from a number-input change, marking the source
   * so the fieldControl listener knows the value is an echo of what the user
   * typed rather than a write from outside.
   */
  private setFieldControlValue(value: string): void {
    const control = this.fieldControl();
    if (!control) {
      return;
    }
    this.valueUpdateSource = 'input';
    try {
      control.setValue(value);
    } finally {
      // a throwing consumer validator or subscriber must not leave the source
      // stuck on 'input', which would misclassify every later external write
      this.valueUpdateSource = 'external';
    }
  }

  /**
   * Listens for changes in the prefix control value and updates the number control accordingly.
   * If includeDialCode is true and the data contains a dialCode, sets the number control value with the dial code.
   * If isLoading is false, focuses on the number input element after a timeout.
   */
  private startPrefixValueChangesListener(): void {
    this.prefixCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe((data) => {
        const dialPrefix = data ? this.getCountryDialPrefix(data) : '';
        if (this.includeDialCode() && dialPrefix) {
          if (this.useMask()) {
            // the mask renders the new dial code itself as fixed characters.
            // Clear synchronously (without events) so the telForm emission
            // triggered by this country change sees an empty number —
            // otherwise the validator parses the old number and reverts the
            // country selection
            this.telForm
              .get('numberControl')
              ?.setValue('', { emitEvent: false });
            // when the mask binding swaps, imask remasks the old displayed
            // text into garbage (e.g. +34 placeholders become +38_ ...), so
            // reset the control and display again after render
            afterNextRender(
              () => {
                this.telForm.get('numberControl')?.setValue('');
                // the value clear can be a no-op for imask (its internal
                // value is already empty — the garbage only lives in the DOM
                // element), so clear the element through a real input event,
                // a path imask fully processes and re-renders from
                const inputElement: HTMLInputElement | undefined =
                  this.numberInput()?.nativeElement;
                if (inputElement) {
                  inputElement.value = '';
                  inputElement.dispatchEvent(
                    new Event('input', { bubbles: true })
                  );
                }
              },
              { injector: this.injector }
            );
          } else {
            this.telForm
              .get('numberControl')
              ?.setValue(`+${dialPrefix}`, { emitEvent: false });
          }
        }
        if (!this.isLoading()) {
          setTimeout(() => {
            this.numberInput()?.nativeElement?.focus();
          });
        }
      });
  }

  /**
   * Sets the initial telephone value based on the initial value.
   */
  private setInitialTelValue(): void {
    if (!this.initialValue()) {
      // set initial selection
      if (this.autoSelectCountry()) {
        if (this.autoIpLookup()) {
          this.geoIpLookup();
        } else {
          this.setAutoSelectedCountry();
          this.isLoading.set(false);
        }
      } else {
        this.isLoading.set(false);
      }
    } else {
      try {
        const parsedNumber = this.phoneNumberUtil.parse(this.initialValue());
        const country = countryUtils.findCountryByParsedNumber(
          parsedNumber,
          this.allCountries
        );
        if (country) {
          this.prefixCtrl.setValue(country);
        }
        const formattedOnlyNumber = countryUtils.formatForNumberInput(
          parsedNumber,
          {
            includeDialCode: this.includeDialCode(),
            outputNumberFormat: this.outputNumberFormat()
          }
        );
        if (formattedOnlyNumber) {
          this.telForm.get('numberControl')?.setValue(formattedOnlyNumber);
        }
      } catch {
        this.telForm.get('numberControl')?.setValue(this.initialValue());
        this.fieldControl()?.setValue(this.initialValue());
        this.fieldControl()?.markAsDirty();
      } finally {
        this.isLoading.set(false);
      }
    }
  }

  /**
   * Set the auto selected country based on the specified criteria.
   *
   */
  private setAutoSelectedCountry(): void {
    const autoSelectedCountry = this.allCountries?.find(
      (country) => country?.iso2 === this.autoSelectedCountry()
    );
    if (autoSelectedCountry) {
      this.prefixCtrl.setValue(autoSelectedCountry);
    } else {
      const defaultCountry = this.allCountries?.find(
        (country) => country?.iso2 === CountryISO.Spain
      );
      if (defaultCountry) {
        this.prefixCtrl.setValue(defaultCountry);
      } else {
        this.prefixCtrl.setValue(this.allCountries?.[0]);
      }
    }
  }

  /**
   * Listens to changes in the field control value and updates it accordingly.
   * If the value is valid, it parses and formats it using the phoneNumberUtil.
   * If the value is not valid, it sets the value as is.
   * Finally, emits the currentValue signal with the updated field control value.
   */
  private startFieldControlValueChangesListener(): void {
    const valueChanges = this.fieldControl()
      ?.valueChanges as Observable<string>;
    valueChanges.pipe(takeUntil(this._onDestroy)).subscribe((data: string) => {
      const source = this.valueUpdateSource;
      if (data) {
        try {
          const parsed = this.phoneNumberUtil.parse(
            data,
            this.telForm?.value?.prefixCtrl?.iso2
          );
          const formatted = this.phoneNumberUtil.format(
            parsed,
            this.outputNumberFormat()
          );
          this.fieldControl()?.setValue(formatted, { emitEvent: false });
          this.applyValueToTelForm(parsed, source);
        } catch {
          this.fieldControl()?.setValue(data, { emitEvent: false });
          this.applyUnparseableValueToTelForm(data, source);
        }
      } else {
        this.telForm.get('numberControl')?.setValue('', { emitEvent: false });
        this.fieldControl()?.setValue('', { emitEvent: false });
      }
      this.value.set(this.fieldControl()?.value || '');
      this.currentValue?.emit(this.fieldControl()?.value || data);
      this.currentCountryCode?.emit(
        this.prefixCtrl.value?.dialCode
          ? `+${this.prefixCtrl.value?.dialCode}`
          : ''
      );
      this.currentCountryISO?.emit(this.prefixCtrl.value?.iso2 || '');
    });
  }

  /**
   * The single place the country selector and the number input are repainted
   * from a fieldControl value, whatever set it — the user typing, a Reactive
   * Forms `setValue`, or a Signal Forms field write. Used to live inside the
   * validator, which meant it ran during change detection's validation pass.
   *
   * Both resolutions are applied in order, dial code first, so the selector
   * lands where the validator's `finalIso` says it will. All writes suppress
   * events so they cannot echo back into fieldControl.
   */
  private applyValueToTelForm(
    parsedNumber: PhoneNumber,
    source: 'input' | 'external'
  ): void {
    // With validation off the input is left exactly as typed; only a write
    // from outside repaints it.
    if (!this.numberValidation() && source === 'input') {
      return;
    }
    const sequence = countryUtils.resolveCountrySequence(
      parsedNumber,
      this.allCountries,
      {
        includeDialCode: this.includeDialCode(),
        currentIso: this.telForm?.value?.prefixCtrl?.iso2,
        currentDialCode: this.telForm?.value?.prefixCtrl?.dialCode
      }
    );
    this.setPrefixIfDifferent(sequence.fromDialCode);
    this.setPrefixIfDifferent(sequence.fromParsed);
    const formattedNumber = countryUtils.formatForNumberInput(parsedNumber, {
      includeDialCode: this.includeDialCode(),
      outputNumberFormat: this.outputNumberFormat()
    });
    this.telForm
      .get('numberControl')
      ?.setValue(formattedNumber, { emitEvent: false });
    this.mirrorValidationToNumberControl();
  }

  /**
   * Same path for a value the parser rejected: there is nothing to format or
   * resolve, so only an outside write repaints the input, and the validation
   * verdict is still mirrored onto it.
   */
  private applyUnparseableValueToTelForm(
    value: string,
    source: 'input' | 'external'
  ): void {
    if (source === 'external') {
      this.telForm.get('numberControl')?.setValue(value, { emitEvent: false });
    }
    this.mirrorValidationToNumberControl();
  }

  /**
   * Selects a country, skipping the write when it is already selected.
   */
  private setPrefixIfDifferent(country: Country | undefined): void {
    if (country && country.iso2 !== this.telForm?.value?.prefixCtrl?.iso2) {
      this.prefixCtrl.setValue(country, { emitEvent: false });
    }
  }

  /**
   * Returns the complete prefix needed to start an international number. A
   * country with one area code under a shared calling code needs both parts,
   * for example Northern Mariana Islands is +1 670 rather than only +1.
   */
  private getCountryDialPrefix(country: Country): string {
    const areaCode =
      country.areaCodes?.length === 1 ? country.areaCodes[0] : '';
    return `${country.dialCode}${areaCode}`;
  }

  /**
   * Mirrors the number errors from the fieldControl onto the number input, so
   * the input renders as invalid alongside the field. Only the two number
   * errors are mirrored, and only while number validation is on — without it
   * the validator never ran and the input never carried these errors.
   */
  private mirrorValidationToNumberControl(): void {
    if (!this.numberValidation()) {
      return;
    }
    const numberControl = this.telForm.get('numberControl');
    const errors = this.fieldControl()?.errors;
    if (errors?.['invalidNumber']) {
      numberControl?.setErrors({ invalidNumber: true });
    } else if (errors?.['numberTooLong']) {
      numberControl?.setErrors({ numberTooLong: true });
    } else {
      numberControl?.setErrors(null);
    }
  }

  /**
   * Listens to changes in the status of the field control and updates the 'disabled' model accordingly.
   * If the status is 'DISABLED', sets the 'disabled' model to true; otherwise, sets it to false.
   */
  private startFieldControlStatusChangesListener(): void {
    this.fieldControl()
      ?.statusChanges.pipe(takeUntil(this._onDestroy))
      .subscribe((status: FormControlStatus) => {
        if (status === 'DISABLED') {
          this.disabled.set(true);
        } else {
          this.disabled.set(false);
        }
      });
  }

  /**
   * Sets the field control based on the provided field control name.
   * If the field control name exists in the control container, it sets the field control to that value.
   * Additionally, it checks for the initial value, required validator, and disabled state of the field control.
   */
  private setFieldControl(): void {
    if (
      this.fieldControlName() &&
      this.controlContainer?.control?.get(this.fieldControlName())
    ) {
      this.fieldControl.set(
        this.controlContainer.control.get(this.fieldControlName())
      );
    }
    if (this.fieldControl()?.value) {
      this.initialValue.set(this.fieldControl()?.value);
    } else if (this.value()) {
      this.initialValue.set(this.value());
    }
    if (this.fieldControl()?.hasValidator(Validators.required)) {
      this.required.set(true);
    }
    if (this.fieldControl()?.disabled) {
      this.disabled.set(true);
    }
  }

  /**
   * Sets the cursor position in the input element after formatting the phone number.
   *
   * @param inputElement - The HTML input element where the cursor position is to be set.
   * @param cursorPosition - The current cursor position in the input element.
   * @param parsed - The parsed phone number object.
   * @param currentValue - The current value of the input element.
   */
  private setCursorPosition(
    inputElement: HTMLInputElement,
    cursorPosition: number,
    parsed: PhoneNumber,
    currentValue: string
  ): void {
    // with useMask, imask owns the input's value and caret: the position
    // captured here is stale (taken before imask repositions past mask
    // separators), so restoring it would pull the cursor back
    if (!this.numberValidation() || this.useMask()) {
      return;
    }
    const nationalNumber = this.phoneNumberUtil.format(
      parsed,
      this.includeDialCode()
        ? this.outputNumberFormat()
        : PhoneNumberFormat.NATIONAL
    );
    const newCursorPosition = caretUtils.adjustCursorPosition(
      cursorPosition as number,
      currentValue,
      nationalNumber
    );
    setTimeout(() => {
      inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  }

  /**
   * Gets the maximum input length for a given country code.
   * This is used to set the maxlength attribute on the input field.
   * Dynamically adjusts based on whether the current number is valid/formatted.
   *
   * @param countryCode ISO2 country code
   * @returns Maximum allowed length for the input field
   */
  getMaxInputLength = (countryCode?: string): number =>
    phoneNumberUtils.getMaxInputLength({
      countryCode,
      currentValue: this.telForm.get('numberControl')?.value || '',
      dialCode: this.prefixCtrl.value?.dialCode,
      includeDialCode: this.includeDialCode(),
      outputNumberFormat: this.outputNumberFormat()
    });
}
