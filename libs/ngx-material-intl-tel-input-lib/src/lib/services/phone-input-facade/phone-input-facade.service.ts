import { Injectable, inject, signal, computed } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber';
import { firstValueFrom } from 'rxjs';

import { Country } from '../../types/country.model';
import { CountryISO } from '../../enums/country-iso.enum';
import { CountryDataService } from '../country-data/country-data.service';
import { GeoIpService } from '../geo-ip/geo-ip.service';
import { CountryCode } from '../../data/country-code';
import TelValidators from '../../validators/tel.validators';
import { getMaxPhoneNumberLength } from '../../utils/phone-number.utils';

export interface PhoneInputConfig {
  enablePlaceholder?: boolean;
  includeDialCode?: boolean;
  autoIpLookup?: boolean;
  autoSelectCountry?: boolean;
  autoSelectedCountry?: CountryISO | string;
  preferredCountries?: (CountryISO | string)[];
  visibleCountries?: (CountryISO | string)[];
  excludedCountries?: (CountryISO | string)[];
  useMask?: boolean;
  forceSelectedCountryCode?: boolean;
  showMaskPlaceholder?: boolean;
  outputNumberFormat?: PhoneNumberFormat;
  numberValidation?: boolean;
}

@Injectable()
export class PhoneInputFacadeService {
  private readonly phoneNumberUtil = PhoneNumberUtil.getInstance();
  private readonly countryDataService = inject(CountryDataService);
  private readonly geoIpService = inject(GeoIpService);
  private readonly countryCodeData = inject(CountryCode);

  // State signals
  private _selectedCountry = signal<Country | null>(null);
  private _phoneNumber = signal<string>('');
  private _isValid = signal<boolean>(false);
  private _isFocused = signal<boolean>(false);
  private _isLoading = signal<boolean>(true);
  private _allCountries = signal<Country[]>([]);
  private _filteredCountries = signal<Country[]>([]);

  // Public readonly signals
  readonly selectedCountry = this._selectedCountry.asReadonly();
  readonly phoneNumber = this._phoneNumber.asReadonly();
  readonly isValid = this._isValid.asReadonly();
  readonly isFocused = this._isFocused.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly allCountries = this._allCountries.asReadonly();
  readonly filteredCountries = this._filteredCountries.asReadonly();

  // Form controls
  readonly fieldControl = new FormControl<string>('');
  readonly prefixControl = new FormControl<Country | null>(null);
  readonly numberControl = new FormControl<string>('');
  readonly searchControl = new FormControl<string>('');

  // Form group to match legacy component structure
  readonly telForm = new FormGroup({
    prefixCtrl: this.prefixControl,
    numberControl: this.numberControl
  });

  // Configuration
  private _config = signal<PhoneInputConfig>({});
  readonly config = this._config.asReadonly();

  // Computed values
  readonly formattedPhoneNumber = computed(() => {
    const phoneNumber = this._phoneNumber();
    const country = this._selectedCountry();
    const config = this._config();

    if (!phoneNumber || !country || !config.outputNumberFormat) {
      return phoneNumber;
    }

    return this.formatPhoneNumber(config.outputNumberFormat);
  });

  readonly maxInputLength = computed(() => {
    const country = this._selectedCountry();
    return country ? getMaxPhoneNumberLength(country.iso2) : 15;
  });

  constructor() {
    this.setupFormControlListeners();
  }

  /**
   * Initialize the facade with configuration
   */
  async initialize(config: PhoneInputConfig = {}): Promise<void> {
    this._config.set(config);
    this._isLoading.set(true);

    try {
      // Process countries
      const countries = this.countryDataService.processCountries(
        this.countryCodeData,
        config.enablePlaceholder ?? true,
        config.includeDialCode ?? false,
        config.visibleCountries,
        config.preferredCountries,
        config.excludedCountries,
        config.useMask,
        config.forceSelectedCountryCode,
        config.showMaskPlaceholder,
        config.outputNumberFormat
      );

      this._allCountries.set(countries);
      this._filteredCountries.set(countries);

      // Auto-select country
      if (config.autoSelectCountry !== false) {
        await this.autoSelectCountry();
      }

      // If no country is selected, select the first available country
      if (!this._selectedCountry() && countries.length > 0) {
        this.setSelectedCountry(countries[0]);
      }

      // Set up validation
      if (config.numberValidation !== false) {
        this.setupValidation();
      }

      this._isLoading.set(false);
    } catch (error) {
      console.error('Failed to initialize phone input:', error);
      this._isLoading.set(false);
    }
  }

  /**
   * Set the selected country
   */
  setSelectedCountry(country: Country): void {
    this._selectedCountry.set(country);
    this.prefixControl.setValue(country);
    this.validateAndUpdateControls();
  }

  /**
   * Set the phone number
   */
  setPhoneNumber(phoneNumber: string): void {
    this._phoneNumber.set(phoneNumber);
    this.numberControl.setValue(phoneNumber);
    this.validateAndUpdateControls();
  }

  /**
   * Set focus state
   */
  setFocusState(focused: boolean): void {
    this._isFocused.set(focused);
  }

  /**
   * Filter countries based on search term
   */
  filterCountries(searchTerm: string): void {
    const allCountries = this._allCountries();
    if (!searchTerm) {
      this._filteredCountries.set(allCountries);
      return;
    }

    const filtered = allCountries.filter(
      (country) =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.iso2.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.dialCode.includes(searchTerm)
    );

    this._filteredCountries.set(filtered);
  }

  /**
   * Add required validator if needed
   */
  setRequired(required: boolean): void {
    const validators = required ? [Validators.required] : [];
    this.fieldControl.setValidators(validators);
    this.fieldControl.updateValueAndValidity();
  }

  /**
   * Format phone number according to specified format
   */
  formatPhoneNumber(format: PhoneNumberFormat): string {
    const phoneNumber = this._phoneNumber();
    const country = this._selectedCountry();

    if (!phoneNumber || !country) return phoneNumber;

    try {
      const parsedNumber = this.phoneNumberUtil.parseAndKeepRawInput(
        phoneNumber,
        country.iso2
      );
      return this.phoneNumberUtil.format(parsedNumber, format);
    } catch {
      return phoneNumber;
    }
  }

  /**
   * Check if current phone number is valid
   */
  isPhoneNumberValid(): boolean {
    const phoneNumber = this._phoneNumber();
    const country = this._selectedCountry();

    if (!phoneNumber || !country) return false;

    try {
      const parsedNumber = this.phoneNumberUtil.parseAndKeepRawInput(
        phoneNumber,
        country.iso2
      );
      return this.phoneNumberUtil.isValidNumber(parsedNumber);
    } catch {
      return false;
    }
  }

  /**
   * Get current country code
   */
  getCurrentCountryCode(): string {
    return this._selectedCountry()?.dialCode || '';
  }

  /**
   * Get current country ISO
   */
  getCurrentCountryISO(): string {
    return this._selectedCountry()?.iso2 || '';
  }

  private setupFormControlListeners(): void {
    // Listen to prefix control changes
    this.prefixControl.valueChanges.subscribe((country) => {
      if (country && country !== this._selectedCountry()) {
        this._selectedCountry.set(country);
        this.validateAndUpdateControls();
      }
    });

    // Listen to number control changes
    this.numberControl.valueChanges.subscribe((phoneNumber) => {
      const currentNumber = phoneNumber || '';
      if (currentNumber !== this._phoneNumber()) {
        this._phoneNumber.set(currentNumber);
        this.validateAndUpdateControls();
      }
    });
  }

  private validateAndUpdateControls(): void {
    const isValid = this.isPhoneNumberValid();
    this._isValid.set(isValid);

    // Update field control with formatted number
    const formattedNumber = this.formattedPhoneNumber();
    if (formattedNumber !== this.fieldControl.value) {
      this.fieldControl.setValue(formattedNumber, { emitEvent: false });
    }
  }

  private setupValidation(): void {
    const config = this._config();
    if (config.numberValidation === false) return;

    // Create a form group for validation
    const telForm = {
      get: (key: string) =>
        key === 'prefixCtrl' ? this.prefixControl : this.numberControl,
      value: {
        prefixCtrl: this.prefixControl?.value,
        numberControl: this.numberControl?.value
      }
    };

    const validator = TelValidators.isValidNumber(
      telForm as any,
      config.includeDialCode ?? false,
      this._allCountries(),
      config.outputNumberFormat ?? PhoneNumberFormat.INTERNATIONAL
    );

    this.fieldControl.setValidators([validator]);
    this.fieldControl.updateValueAndValidity();
  }

  private async autoSelectCountry(): Promise<void> {
    const config = this._config();

    // Try auto-selected country first
    if (config.autoSelectedCountry) {
      const country = this._allCountries().find(
        (c) =>
          c.iso2 === config.autoSelectedCountry ||
          c.name === config.autoSelectedCountry
      );
      if (country) {
        this.setSelectedCountry(country);
        return;
      }
    }

    // Try geo IP lookup
    if (config.autoIpLookup) {
      try {
        const geoData = await firstValueFrom(this.geoIpService.geoIpLookup());
        if (geoData?.country_code) {
          const country = this._allCountries().find(
            (c) => c.iso2.toLowerCase() === geoData.country_code.toLowerCase()
          );
          if (country) {
            this.setSelectedCountry(country);
          }
        }
      } catch (error) {
        console.warn('Failed to get geo IP data:', error);
      }
    }
  }
}
