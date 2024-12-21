import { AsyncPipe, NgClass, NgTemplateOutlet } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  effect,
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
import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';
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
    requiredError: 'This field is required'
  });
  useMask = input<boolean>(false);
  forceSelectedCountryCode = input<boolean>(false);
  showMaskPlaceholder = input<boolean>(false);
  currentValue = output<string>();
  currentCountryCode = output<string>();
  currentCountryISO = output<string>();
  isFocused = signal<boolean>(false);
  isLoading = signal<boolean>(true);

  constructor(
    private countryCodeData: CountryCode,
    private geoIpService: GeoIpService,
    private countryDataService: CountryDataService,
    private controlContainer: ControlContainer
  ) {
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
      this.showMaskPlaceholder()
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
        if (data?.numberControl) {
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
              PhoneNumberFormat.INTERNATIONAL
            );
            this.fieldControl()?.setValue(formatted);
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
            PhoneNumberFormat.INTERNATIONAL
          );
          this.fieldControl()?.setValue(formatted, { emitEvent: false });
        } catch {
          this.fieldControl()?.setValue(data, { emitEvent: false });
        }
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
}
