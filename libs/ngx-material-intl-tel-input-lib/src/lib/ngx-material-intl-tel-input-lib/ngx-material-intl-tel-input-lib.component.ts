import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  ControlContainer,
  ControlValueAccessor,
  FormControl,
  FormControlStatus,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
  Validators
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import {
  MAT_SELECT_CONFIG,
  MatSelect,
  MatSelectModule
} from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Observable } from 'rxjs';
import {
  CountryCode as LibCountryCode,
  PhoneNumber,
  getCountryCallingCode,
  parsePhoneNumberWithError
} from 'libphonenumber-js';
import { CountryCode } from '../data/country-code';
import { Country } from '../types/country.model';
import {
  MatFormFieldAppearance,
  MatFormFieldModule
} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import TelValidators, {
  validatePhoneNumber
} from '../validators/tel.validators';
import { GeoIpService } from '../services/geo-ip/geo-ip.service';
import { GeoData } from '../types/geo.type';
import { TextLabels } from '../types/text-labels.type';
import { CountryISO } from '../enums/country-iso.enum';
import {
  normalizePhoneNumberFormat,
  PhoneNumberFormat,
  PhoneNumberOutputFormat
} from '../enums/phone-number-format.enum';
import { CountryDataService } from '../services/country-data/country-data.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IMaskModule } from 'angular-imask';
import {
  formatPhoneNumber,
  getMaxPhoneNumberLength
} from '../utils/phone-number.utils';
import { PhoneIconComponent } from '../components/phone-icon/phone-icon.component';

let nextUniqueId = 0;

@Component({
  selector: 'ngx-material-intl-tel-input',
  templateUrl: './ngx-material-intl-tel-input-lib.component.html',
  styleUrl: './ngx-material-intl-tel-input-lib.component.scss',
  imports: [
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
    CountryDataService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NgxMaterialIntlTelInputComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => NgxMaterialIntlTelInputComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgxMaterialIntlTelInputComponent
  implements OnInit, AfterViewInit, ControlValueAccessor, Validator
{
  private readonly countryCodeData = inject(CountryCode);
  private readonly geoIpService = inject(GeoIpService);
  private readonly countryDataService = inject(CountryDataService);
  private readonly controlContainer = inject(ControlContainer, {
    optional: true
  });
  private readonly destroyRef = inject(DestroyRef);

  /** control for the selected country prefix */
  public prefixCtrl: FormControl<Country | null> =
    new FormControl<Country | null>(null);

  /** control for the MatSelect filter keyword */
  public prefixFilterCtrl: FormControl<string | null> = new FormControl<
    string | null
  >('');

  singleSelect = viewChild<MatSelect>('singleSelect');
  numberInput = viewChild<ElementRef>('numberInput');

  allCountries = signal<Country[]>([]);

  private readonly searchTerm = toSignal(this.prefixFilterCtrl.valueChanges, {
    initialValue: ''
  });

  /** list of countries filtered by search keyword */
  filteredCountries = computed(() => {
    const search = this.normalizeSearchValue(this.searchTerm());
    const countries = this.allCountries();
    if (!search) {
      return countries;
    }
    return countries.filter((country) =>
      this.normalizeSearchValue(country?.name).includes(search)
    );
  });

  telForm = new FormGroup({
    prefixCtrl: this.prefixCtrl,
    numberControl: new FormControl('')
  });

  /**
   * @deprecated Bind the component with `formControlName` / `[formControl]` / `ngModel`
   * instead: the component implements ControlValueAccessor. `fieldControl` remains
   * supported for backwards compatibility.
   */
  fieldControl = model<
    FormControl | AbstractControl<string | null, string | null> | null
  >(new FormControl(''));
  /**
   * @deprecated Bind the component with `formControlName` instead: the component
   * implements ControlValueAccessor.
   */
  fieldControlName = input<string>('');
  required = model<boolean>(false);
  disabled = model<boolean>(false);
  appearance = input<MatFormFieldAppearance>('fill');
  enablePlaceholder = input<boolean>(true);
  autoIpLookup = input<boolean>(false);
  autoSelectCountry = input<boolean>(true);
  autoSelectedCountry = input<CountryISO | string>('');
  /** Country selected when no better candidate is available (auto-select and geo-IP failed). */
  defaultCountry = input<CountryISO | string>(CountryISO.Spain);
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
  outputNumberFormat = input<PhoneNumberOutputFormat>(
    PhoneNumberFormat.INTERNATIONAL
  );
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

  /** id of the hint/error region, referenced by the input's aria-describedby */
  protected readonly describedById = `ngx-mitl-described-${nextUniqueId++}`;

  /** Reflects the outer control's error state onto the inner Material input. */
  protected readonly innerErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: () =>
      !!this.fieldControl()?.invalid &&
      !!(this.fieldControl()?.dirty || this.fieldControl()?.touched)
  };

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;
  private readonly phoneValidator = TelValidators.isValidNumber(
    () => this.telForm?.value?.prefixCtrl?.iso2
  );
  private initialized = false;
  private writingValue = false;

  constructor() {
    effect(() => {
      this.syncValidators();
    });
    effect(() => {
      this.applyDisabledState();
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
    this.startTelFormValueChangesListener();
    this.startPrefixValueChangesListener();
    setTimeout(() => {
      this.writingValue = true;
      try {
        this.setInitialTelValue();
        this.initialized = true;
      } finally {
        this.writingValue = false;
      }
    });
    this.startFieldControlValueChangesListener();
    this.startFieldControlStatusChangesListener();
  }

  /**
   * Fetches country data and populates the allCountries signal.
   */
  protected fetchCountryData(): void {
    this.allCountries.set(
      this.countryDataService.processCountries(this.countryCodeData, {
        enablePlaceholder: this.enablePlaceholder(),
        includeDialCode: this.includeDialCode(),
        visibleCountries: this.visibleCountries(),
        preferredCountries: this.preferredCountries(),
        excludedCountries: this.excludedCountries(),
        useMask: this.useMask(),
        forceSelectedCountryCode: this.forceSelectedCountryCode(),
        showMaskPlaceholder: this.showMaskPlaceholder(),
        outputNumberFormat: this.outputNumberFormat(),
        localizeCountryNames: this.localizeCountryNames()
      })
    );
  }

  /**
   * Adds validations to the form field based on the current configuration.
   * It sets required validators and disabled state, and if number validation is enabled,
   * it adds a pure phone number validator to the field control.
   */
  private addValidations(): void {
    this.syncValidators();
    this.applyDisabledState();
  }

  /** Keeps the internal and outer-control validators aligned with inputs. */
  private syncValidators(): void {
    this.setRequiredValidators();
    if (this.numberValidation()) {
      this.fieldControl()?.addValidators(this.phoneValidator);
    } else {
      this.fieldControl()?.removeValidators(this.phoneValidator);
    }
    this.fieldControl()?.updateValueAndValidity({ emitEvent: false });
    this.onValidatorChange();
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
  applyDisabledState(): void {
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
   * Sets the compareWith function on the country select, which triggers initializing
   * the selection according to the current value of the prefix control.
   *
   * @return {void}
   */
  ngAfterViewInit(): void {
    const singleSelectInstance = this.singleSelect();
    if (singleSelectInstance) {
      singleSelectInstance.compareWith = (a: Country, b: Country) =>
        !!(a && b && a.iso2 === b.iso2);
    }
  }

  //#region ControlValueAccessor

  /**
   * Writes a new value from the bound form control into the component.
   */
  writeValue(value: string | null): void {
    const normalized = value ?? '';
    if (!this.initialized) {
      this.initialValue.set(normalized);
      return;
    }
    this.writingValue = true;
    try {
      this.fieldControl()?.setValue(normalized);
    } finally {
      this.writingValue = false;
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  /** Called by the forms API when the bound control's disabled state changes. */
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  /**
   * Validates the bound control's value as an international phone number.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    if (this.required() && !control.value) {
      return { required: true };
    }
    if (!this.numberValidation()) {
      return null;
    }
    return validatePhoneNumber(
      control.value,
      this.telForm?.value?.prefixCtrl?.iso2
    );
  }

  //#endregion

  /**
   * Performs a geo IP lookup and sets the prefix control value based on the country retrieved.
   */
  private geoIpLookup(): void {
    this.geoIpService.geoIpLookup().subscribe({
      next: (data: GeoData) => {
        const country =
          this.allCountries().find(
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
        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Whether the visible input shows the number including its dial code.
   * Northern Mariana Islands ('mp') always does: its +1 670 numbers are
   * indistinguishable from US numbers in national format.
   */
  protected requiresDialCode(iso2?: CountryISO | string): boolean {
    return this.includeDialCode() || iso2 === 'mp';
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
   */
  onInputBlur(): void {
    this.isFocused.set(false);
    this.onTouched();
  }

  /**
   * Listens for changes in the telForm value and updates the fieldControl accordingly.
   */
  private startTelFormValueChangesListener(): void {
    this.telForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        const inputElement = this.numberInput()?.nativeElement;
        if (data?.numberControl) {
          const cursorPosition = inputElement?.selectionStart;
          const currentValue = data.numberControl;
          this.fieldControl()?.markAsDirty();
          const callingCode = this.getParsingCallingCode(
            data?.prefixCtrl?.iso2,
            data?.prefixCtrl?.dialCode
          );
          const value =
            callingCode && !this.requiresDialCode(data?.prefixCtrl?.iso2)
              ? '+' + callingCode + data.numberControl
              : data.numberControl;
          try {
            const parsed = parsePhoneNumberWithError(
              value,
              this.toRegion(data?.prefixCtrl?.iso2)
            );
            const formatted = formatPhoneNumber(
              parsed,
              this.outputNumberFormat()
            );
            this.fieldControl()?.setValue(formatted);
            this.setCursorPosition(
              inputElement,
              cursorPosition,
              parsed,
              currentValue
            );
          } catch {
            this.fieldControl()?.setValue(value);
          }
        } else {
          this.fieldControl()?.setValue('');
        }
      });
  }

  /**
   * Listens for changes in the prefix control value and updates the number control accordingly.
   * If includeDialCode is true and the data contains a dialCode, sets the number control value with the dial code.
   * If isLoading is false, focuses on the number input element after a timeout.
   */
  private startPrefixValueChangesListener(): void {
    this.prefixCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        if (this.includeDialCode() && data?.dialCode) {
          this.telForm
            .get('numberControl')
            ?.setValue('+' + data?.dialCode, { emitEvent: false });
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
        const parsedNumber = parsePhoneNumberWithError(this.initialValue());
        const country = this.findCountryForNumber(parsedNumber);
        if (country) {
          this.prefixCtrl.setValue(country);
        }
        const formattedOnlyNumber = formatPhoneNumber(
          parsedNumber,
          this.requiresDialCode(this.telForm?.value?.prefixCtrl?.iso2)
            ? this.outputNumberFormat()
            : PhoneNumberFormat.NATIONAL
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
    const autoSelectedCountry = this.allCountries().find(
      (country) => country?.iso2 === this.autoSelectedCountry()
    );
    if (autoSelectedCountry) {
      this.prefixCtrl.setValue(autoSelectedCountry);
      return;
    }
    const defaultCountry = this.allCountries().find(
      (country) => country?.iso2 === this.defaultCountry()
    );
    this.prefixCtrl.setValue(defaultCountry || this.allCountries()?.[0]);
  }

  /**
   * Finds the Country entry matching a parsed phone number.
   * libphonenumber-js resolves shared calling codes (e.g. +1 area codes) itself,
   * so the ISO country reported by the parser is preferred; numbers it cannot
   * attribute fall back to the highest-priority country for the calling code.
   */
  private findCountryForNumber(parsed: PhoneNumber): Country | undefined {
    const iso = parsed.country?.toLowerCase();
    const countries = this.allCountries();
    if (iso) {
      const match = countries.find((c) => c.iso2 === iso);
      if (match) {
        return match;
      }
    }
    const currentCountry = this.prefixCtrl.value;
    if (
      currentCountry &&
      this.getParsingCallingCode(
        currentCountry.iso2,
        currentCountry.dialCode
      ) === parsed.countryCallingCode
    ) {
      return currentCountry;
    }
    return countries.find(
      (c) => c.dialCode === parsed.countryCallingCode && c.priority === 0
    );
  }

  /**
   * Updates the selected country to match a parsed phone number, without
   * re-triggering value change listeners.
   */
  private syncPrefixFromNumber(parsed: PhoneNumber): void {
    const country = this.findCountryForNumber(parsed);
    if (country && country.iso2 !== this.prefixCtrl.value?.iso2) {
      this.prefixCtrl.setValue(country, { emitEvent: false });
    }
  }

  /**
   * Listens to changes in the field control value and updates it accordingly.
   * If the value is valid, it parses and formats it, keeps the visible number
   * input and the selected country in sync, and notifies the forms API.
   * Finally, emits the currentValue output with the updated field control value.
   */
  private startFieldControlValueChangesListener(): void {
    const valueChanges = this.fieldControl()
      ?.valueChanges as Observable<string>;
    valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: string) => {
        if (data) {
          try {
            const parsed = parsePhoneNumberWithError(
              data,
              this.toRegion(this.telForm?.value?.prefixCtrl?.iso2)
            );
            const formatted = formatPhoneNumber(
              parsed,
              this.outputNumberFormat()
            );
            this.fieldControl()?.setValue(formatted, { emitEvent: false });
            this.syncPrefixFromNumber(parsed);
            const formattedOnlyNumber = formatPhoneNumber(
              parsed,
              this.requiresDialCode(this.telForm?.value?.prefixCtrl?.iso2)
                ? this.outputNumberFormat()
                : PhoneNumberFormat.NATIONAL
            );
            this.telForm
              .get('numberControl')
              ?.setValue(formattedOnlyNumber, { emitEvent: false });
          } catch {
            this.fieldControl()?.setValue(data, { emitEvent: false });
          }
        } else {
          this.telForm.get('numberControl')?.setValue('', { emitEvent: false });
          this.fieldControl()?.setValue('', { emitEvent: false });
        }
        if (!this.writingValue) {
          const value = this.fieldControl()?.value || data;
          this.onChange(value);
          this.currentValue?.emit(value);
          this.currentCountryCode?.emit(
            this.prefixCtrl.value?.dialCode
              ? `+${this.prefixCtrl.value?.dialCode}`
              : ''
          );
          this.currentCountryISO?.emit(this.prefixCtrl.value?.iso2 || '');
        }
      });
  }

  /**
   * Listens to changes in the status of the field control and updates the 'disabled' model accordingly.
   * If the status is 'DISABLED', sets the 'disabled' model to true; otherwise, sets it to false.
   */
  private startFieldControlStatusChangesListener(): void {
    this.fieldControl()
      ?.statusChanges.pipe(takeUntilDestroyed(this.destroyRef))
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
    }
    if (this.fieldControl()?.hasValidator(Validators.required)) {
      this.required.set(true);
    }
    if (this.fieldControl()?.disabled) {
      this.disabled.set(true);
    }
  }

  /**
   * Converts a lowercase ISO2 code to the uppercase region code expected by libphonenumber-js.
   */
  private toRegion(
    iso2: CountryISO | string | undefined | null
  ): LibCountryCode | undefined {
    return iso2 ? (iso2.toUpperCase() as LibCountryCode) : undefined;
  }

  /**
   * Returns the calling code understood by libphonenumber-js. Dataset dial
   * codes may include a NANP area code, such as 1767 for Dominica, while the
   * parser expects the shared country calling code 1.
   */
  private getParsingCallingCode(
    iso2: CountryISO | string | undefined,
    fallback?: string
  ): string {
    const region = this.toRegion(iso2);
    if (!region) {
      return fallback || '';
    }
    try {
      return getCountryCallingCode(region);
    } catch {
      return fallback || '';
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
    if (!this.numberValidation()) {
      return;
    }
    const nationalNumber = formatPhoneNumber(
      parsed,
      this.requiresDialCode(this.prefixCtrl.value?.iso2)
        ? this.outputNumberFormat()
        : PhoneNumberFormat.NATIONAL
    );
    const newCursorPosition = this.adjustCursorPosition(
      cursorPosition as number,
      currentValue,
      nationalNumber
    );
    setTimeout(() => {
      inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  }

  /**
   * Adjusts the cursor position in an input field after a value change,
   * accounting for added or removed spaces in the new value.
   *
   * @param originalPosition - The original cursor position before the value change.
   * @param oldValue - The previous value of the input field.
   * @param newValue - The new value of the input field.
   * @returns The adjusted cursor position, ensuring it remains within valid bounds.
   */
  private adjustCursorPosition(
    originalPosition: number,
    oldValue: string,
    newValue: string
  ): number {
    let cursorPosition = originalPosition;
    const spaceCountBefore = this.countSpacesBeforePosition(
      oldValue,
      originalPosition
    );
    const spaceCountAfter = this.countSpacesBeforePosition(
      newValue,
      cursorPosition
    );
    // Adjust cursor if spaces are added or removed
    cursorPosition += spaceCountAfter - spaceCountBefore;
    if (originalPosition === oldValue.length) {
      return newValue.length;
    }
    // Ensure cursor position is within valid bounds
    cursorPosition = Math.max(0, Math.min(cursorPosition, newValue.length));
    return cursorPosition;
  }

  /**
   * Counts the number of spaces in a string before a specified position.
   *
   * @param value - The string to be evaluated.
   * @param position - The position in the string up to which spaces are counted.
   * @returns The number of spaces found before the specified position.
   */
  private countSpacesBeforePosition(value: string, position: number): number {
    return value
      .slice(0, position)
      .split('')
      .filter((char) => char === ' ').length;
  }

  /**
   * Gets the maximum input length for a given country code.
   * This is used to set the maxlength attribute on the input field.
   * A generous cap only: exact too-long detection is the validator's job.
   *
   * @param countryCode ISO2 country code
   * @returns Maximum allowed length for the input field
   */
  getMaxInputLength = (countryCode?: string): number => {
    if (!countryCode) {
      return 25; // Default fallback with generous space
    }
    let buffer = this.includeDialCode() ? 8 : 6;
    if (
      this.includeDialCode() &&
      normalizePhoneNumberFormat(this.outputNumberFormat()) ===
        PhoneNumberFormat.RFC3966
    ) {
      buffer += 6; // room for the "tel:" prefix and separators while typing
    }
    return getMaxPhoneNumberLength(countryCode) + buffer;
  };
}
