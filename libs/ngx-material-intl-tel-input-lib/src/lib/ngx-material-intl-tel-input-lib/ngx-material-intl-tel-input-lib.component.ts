import { AsyncPipe, NgClass, NgTemplateOutlet } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
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
  PhoneNumberUtil,
  PhoneNumberType
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
import { getMaxPhoneNumberLength } from '../utils/phone-number.utils';

@Component({
  selector: 'ngx-material-intl-tel-input',
  templateUrl: './ngx-material-intl-tel-input-lib.component.html',
  styleUrl: './ngx-material-intl-tel-input-lib.component.scss',
  imports: [
    AsyncPipe,
    MatSelectModule,
    NgxMatSelectSearchModule,
    ReactiveFormsModule,
    NgClass,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    NgTemplateOutlet,
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
  implements OnInit, AfterViewInit, OnDestroy
{
  private readonly countryCodeData = inject(CountryCode);
  private readonly geoIpService = inject(GeoIpService);
  private readonly countryDataService = inject(CountryDataService);
  private readonly controlContainer = inject(ControlContainer);

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

  allCountries: Country[] = [];
  phoneNumberUtil = PhoneNumberUtil.getInstance();

  telForm = new FormGroup({
    prefixCtrl: this.prefixCtrl,
    numberControl: new FormControl('')
  });

  fieldControl = model<
    FormControl | AbstractControl<string | null, string | null> | null
  >(new FormControl(''));
  fieldControlName = input<string>('');
  required = model<boolean>(false);
  disabled = model<boolean>(false);
  appearance = input<MatFormFieldAppearance>('fill');
  enablePlaceholder = input<boolean>(true);
  autoIpLookup = input<boolean>(true);
  autoSelectCountry = input<boolean>(true);
  autoSelectedCountry = input<CountryISO | string>('');
  numberValidation = input<boolean>(true);
  iconMakeCall = input<boolean>(true);
  initialValue = model<string>('');
  enableSearch = input<boolean>(true);
  includeDialCode = input<boolean>(false);
  emojiFlags = input<boolean>(false);
  hidePhoneIcon = input<boolean>(false);
  preferredCountries = input<(CountryISO | string)[]>([]);
  visibleCountries = input<(CountryISO | string)[]>([]);
  excludedCountries = input<(CountryISO | string)[]>([]);
  textLabels = input<TextLabels>({
    mainLabel: 'Phone number',
    codePlaceholder: 'Code',
    searchPlaceholderLabel: 'Search',
    noEntriesFoundLabel: 'No countries found',
    nationalNumberLabel: 'Number',
    hintLabel: 'Select country and type your phone number',
    invalidNumberError: 'Number is not valid',
    requiredError: 'This field is required',
    numberTooLongError: 'Phone number is too long'
  });
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

  constructor() {
    effect(() => {
      this.setRequiredValidators();
      this.setDisabledState();
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
    setTimeout(() => {
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
      this.outputNumberFormat()
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
          this.allCountries,
          this.outputNumberFormat()
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
        singleSelectInstance.compareWith = (a: Country, b: Country) =>
          a && b && a.iso2 === b.iso2;
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
    let search = this.prefixFilterCtrl.value || '';
    if (!search) {
      this.filteredCountries.next(this.allCountries.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the countries
    this.filteredCountries.next(
      this.allCountries.filter(
        (country) => country?.name?.toLowerCase()?.indexOf(search) > -1
      )
    );
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
          let value = '';
          if (
            data?.prefixCtrl?.dialCode &&
            !this.includeDialCode() &&
            data?.prefixCtrl?.iso2 !== 'mp'
          ) {
            value = '+' + data.prefixCtrl.dialCode + data.numberControl;
          } else {
            value = data.numberControl;
          }
          try {
            const parsed = this.phoneNumberUtil.parse(
              value,
              data?.prefixCtrl?.iso2
            );
            const formatted = this.phoneNumberUtil.format(
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
      .pipe(takeUntil(this._onDestroy))
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
        const parsedNumber = this.phoneNumberUtil.parse(this.initialValue());
        const countryCode = parsedNumber.getCountryCode();
        const country = this.allCountries?.find(
          (c) => c.dialCode === `${countryCode}`
        );
        if (country) {
          this.prefixCtrl.setValue(country);
        }
        const nationalNumber =
          parsedNumber?.getNationalNumber()?.toString() || '';
        if (nationalNumber) {
          this.telForm.get('numberControl')?.setValue(nationalNumber);
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
        } catch {
          this.fieldControl()?.setValue(data, { emitEvent: false });
        }
      } else {
        this.telForm.get('numberControl')?.setValue('', { emitEvent: false });
        this.fieldControl()?.setValue('', { emitEvent: false });
      }
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
    const nationalNumber = this.phoneNumberUtil.format(
      parsed,
      this.includeDialCode()
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
   * Dynamically adjusts based on whether the current number is valid/formatted.
   *
   * @param countryCode ISO2 country code
   * @returns Maximum allowed length for the input field
   */
  getMaxInputLength = (countryCode?: string): number => {
    if (!countryCode) {
      return 25; // Default fallback with generous space
    }

    try {
      const baseMaxLength = getMaxPhoneNumberLength(countryCode);
      const currentValue = this.telForm.get('numberControl')?.value || '';

      // Check if the current number is valid and formatted
      const isCurrentNumberValid = this.isCurrentNumberValidAndFormatted(
        currentValue,
        countryCode
      );

      if (isCurrentNumberValid) {
        // For valid numbers, allow full formatting space
        const formattingBuffer = this.calculateFormattingBuffer(
          countryCode,
          baseMaxLength
        );
        const safetyMargin = this.calculateSafetyMargin();
        return baseMaxLength + formattingBuffer + safetyMargin;
      } else {
        // For invalid numbers, be more restrictive to prevent overly long input
        // Only allow the base number length plus minimal buffer for dial code if included
        let minimalBuffer = this.includeDialCode() ? 4 : 2;

        // Special case: RFC3966 with includeDialCode needs more space even for invalid numbers
        // because "tel:" prefix takes significant space during typing
        if (
          this.includeDialCode() &&
          this.outputNumberFormat() === PhoneNumberFormat.RFC3966
        ) {
          minimalBuffer = 8; // Extra space for "tel:" prefix and formatting
        }

        return baseMaxLength + minimalBuffer;
      }
    } catch (_) {
      // If any errors occur, fall back to a conservative default
      const baseMaxLength = getMaxPhoneNumberLength(countryCode);
      return baseMaxLength + 3; // Minimal fallback buffer
    }
  };

  /**
   * Checks if the current number is valid and properly formatted.
   * Valid formatted numbers contain spaces/separators.
   *
   * @param currentValue Current input value
   * @param countryCode ISO2 country code
   * @returns True if number is valid and formatted
   */
  private isCurrentNumberValidAndFormatted = (
    currentValue: string,
    countryCode: string
  ): boolean => {
    if (!currentValue || currentValue.length < 3) {
      return false; // Too short to be valid
    }

    try {
      // Try to parse the current value
      const fullNumber = this.includeDialCode()
        ? currentValue
        : `+${this.prefixCtrl.value?.dialCode}${currentValue}`;

      const parsedNumber = this.phoneNumberUtil.parse(fullNumber, countryCode);
      const isValid = this.phoneNumberUtil.isValidNumber(parsedNumber);

      // Check if the number contains formatting characters (spaces, dashes, etc.)
      const hasFormatting = /[\s\-()]/.test(currentValue);

      return isValid && hasFormatting;
    } catch (_) {
      return false;
    }
  };

  /**
   * Calculates an appropriate safety margin based on component configuration.
   * Different configurations require different buffer spaces.
   * Uses conservative margins to prevent overly long input that requires JS correction.
   *
   * @returns Calculated safety margin
   */
  private calculateSafetyMargin = (): number => {
    let safetyMargin = 1; // Reduced base safety margin

    // If dial code is included in the input, we need slightly more space
    // because the user types the dial code along with the number
    if (this.includeDialCode()) {
      safetyMargin += 1; // Reduced from 2 to 1
    }

    // Different output formats have different space requirements
    switch (this.outputNumberFormat()) {
      case PhoneNumberFormat.RFC3966:
        // RFC3966 format (tel: URI) requires additional space for "tel:" prefix
        safetyMargin += 2; // Reduced from 4 to 2
        break;
      case PhoneNumberFormat.E164:
        // E164 is the most compact format, minimal extra space needed
        safetyMargin += 0; // Reduced from 1 to 0 (only base margin)
        break;
      case PhoneNumberFormat.INTERNATIONAL:
      default:
        // International format includes country code and international formatting
        safetyMargin += 1; // Reduced from 2 to 1
        break;
    }

    return safetyMargin;
  };

  /**
   * Calculates the formatting buffer needed for a country's phone number formatting.
   * Analyzes example formatted numbers to determine space requirements.
   *
   * @param countryCode ISO2 country code
   * @param baseLength Base maximum number length
   * @returns Calculated formatting buffer
   */
  private calculateFormattingBuffer = (
    countryCode: string,
    baseLength: number
  ): number => {
    try {
      const phoneUtil = PhoneNumberUtil.getInstance();

      // Get example numbers for analysis
      const numberTypes = [
        PhoneNumberType.MOBILE,
        PhoneNumberType.FIXED_LINE,
        PhoneNumberType.FIXED_LINE_OR_MOBILE
      ];

      let maxFormattingOverhead = 0;

      for (const numberType of numberTypes) {
        try {
          const exampleNumber = phoneUtil.getExampleNumberForType(
            countryCode.toUpperCase(),
            numberType
          );

          if (exampleNumber) {
            // Format the number and calculate the overhead
            const formattedNational = phoneUtil.format(
              exampleNumber,
              PhoneNumberFormat.NATIONAL
            );

            const nationalNumber =
              exampleNumber.getNationalNumber()?.toString() || '';
            const formattingOverhead =
              formattedNational.length - nationalNumber.length;

            maxFormattingOverhead = Math.max(
              maxFormattingOverhead,
              formattingOverhead
            );
          }
        } catch (_) {
          // Continue with next type if this one fails
        }
      }

      // If we couldn't analyze any examples, use a reasonable default
      // Most international formatting adds 2-4 characters for spaces and separators
      return maxFormattingOverhead > 0 ? maxFormattingOverhead : 4;
    } catch (_) {
      // Fallback to a standard formatting buffer
      return 4;
    }
  };
}
