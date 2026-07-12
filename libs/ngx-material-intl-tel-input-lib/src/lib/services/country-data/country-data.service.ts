import { inject, Injectable } from '@angular/core';
import { Country } from '../../types/country.model';
import { CountryCode, CountryData } from '../../data/country-code';
import { CountryISO } from '../../enums/country-iso.enum';
import {
  PhoneNumberFormat,
  PhoneNumberOutputFormat
} from '../../enums/phone-number-format.enum';
import {
  formatPhoneNumber,
  getExampleMobileNumber
} from '../../utils/phone-number.utils';
import { CountryDisplayNameService } from '../country-display-name/country-display-name.service';

export type ProcessCountriesOptions = {
  enablePlaceholder?: boolean;
  includeDialCode?: boolean;
  visibleCountries?: (CountryISO | string)[];
  preferredCountries?: (CountryISO | string)[];
  excludedCountries?: (CountryISO | string)[];
  useMask?: boolean;
  forceSelectedCountryCode?: boolean;
  showMaskPlaceholder?: boolean;
  outputNumberFormat?: PhoneNumberOutputFormat;
  localizeCountryNames?: boolean;
};

@Injectable()
export class CountryDataService {
  private readonly countryDisplayNameService: CountryDisplayNameService =
    inject(CountryDisplayNameService);

  /**
   * Retrieves a Country object based on the provided country data and options.
   *
   * @param {CountryData} countryData - the country data used to create the Country object
   * @param {ProcessCountriesOptions} options - processing options
   * @return {Country} the generated Country object
   */
  private getCountryObject(
    countryData: CountryData,
    options: ProcessCountriesOptions
  ): Country {
    const phoneNumberPlaceholder = this.getPhoneNumberPlaceholder(
      countryData[2].toString().toUpperCase(),
      !!options.includeDialCode,
      options.outputNumberFormat ?? PhoneNumberFormat.INTERNATIONAL
    );
    const isoCode = countryData[2].toString();
    const fallbackName = countryData[1].toString();
    const countryName = options.localizeCountryNames
      ? this.countryDisplayNameService.getCountryName(isoCode, fallbackName)
      : fallbackName;
    const country: Country = {
      emojiFlag: countryData[0].toString(),
      name: countryName,
      iso2: isoCode,
      dialCode: countryData[3].toString(),
      priority: (countryData?.[4] && +countryData[4]) || 0,
      areaCodes: (countryData[5] as string[]) || undefined,
      htmlId: `country-code__${countryData[2].toString()}`,
      flagClass: `country-code__${countryData[2].toString().toLocaleLowerCase()}`,
      placeHolder: options.enablePlaceholder ? phoneNumberPlaceholder : ''
    };
    if (options.useMask) {
      const mask = this.formatPhoneNumberWithPrefix(
        phoneNumberPlaceholder,
        !options.forceSelectedCountryCode
      );
      country.mask = {
        mask: mask,
        lazy: !options.showMaskPlaceholder
      };
    }
    return country;
  }

  /**
   * Sorts the array of countries based on the preferred countries list.
   *
   * @param {Country[]} allCountries - the array of all countries to be sorted
   * @param {string[]} preferredCountries - the list of preferred countries
   * @return {Country[]} the sorted array of countries
   */
  private sortCountries(
    allCountries: Country[],
    preferredCountries?: (CountryISO | string)[]
  ): Country[] {
    if (preferredCountries?.length) {
      return allCountries.sort((a, b) => {
        const aIsPreferred = preferredCountries.includes(a.iso2);
        const bIsPreferred = preferredCountries.includes(b.iso2);
        if (aIsPreferred && bIsPreferred) {
          return (
            preferredCountries.indexOf(a.iso2) -
            preferredCountries.indexOf(b.iso2)
          );
        } else if (aIsPreferred) {
          return -1;
        } else if (bIsPreferred) {
          return 1;
        }
        return 0;
      });
    }
    return allCountries;
  }

  /**
   * Retrieves the placeholder for a phone number based on the provided country code.
   *
   * @param {string} countryCode - The country code for the phone number.
   * @return {string} The formatted phone number placeholder.
   */
  protected getPhoneNumberPlaceholder(
    countryCode: string,
    includeDialCode: boolean,
    outputNumberFormat: PhoneNumberOutputFormat
  ): string {
    const exampleNumber = getExampleMobileNumber(countryCode);
    if (!exampleNumber) {
      return '';
    }
    return formatPhoneNumber(
      exampleNumber,
      includeDialCode || countryCode === 'MP'
        ? outputNumberFormat
        : PhoneNumberFormat.NATIONAL
    );
  }

  /**
   * Process the list of countries based on the provided data and options.
   *
   * @param {CountryCode} countryCodeData - the data containing country codes
   * @param {ProcessCountriesOptions} options - filtering, sorting and formatting options
   * @return {Country[]} the processed and sorted list of countries
   */
  processCountries(
    countryCodeData: CountryCode,
    options: ProcessCountriesOptions = {}
  ): Country[] {
    const { visibleCountries, excludedCountries, preferredCountries } = options;
    const allCountries: Country[] = countryCodeData.allCountries.map(
      (countryData: CountryData) => this.getCountryObject(countryData, options)
    );
    const filteredVisibleCountries = visibleCountries?.length
      ? allCountries.filter((country) =>
          visibleCountries.includes(country.iso2)
        )
      : allCountries;
    const filteredCountries = excludedCountries?.length
      ? filteredVisibleCountries.filter(
          (country) => !excludedCountries.includes(country.iso2)
        )
      : filteredVisibleCountries;
    return this.sortCountries(filteredCountries, preferredCountries);
  }

  /**
   * Formats a phone number by masking its digits while optionally masking the prefix.
   *
   * @param {string} phoneNumber - The phone number to be formatted.
   * @param {boolean} maskPrefix - Flag indicating whether to mask the prefix digits.
   * @return {string} The formatted phone number with masked digits and optionally masked prefix.
   */
  private formatPhoneNumberWithPrefix(
    phoneNumber: string,
    maskPrefix: boolean
  ): string {
    // Match the prefix (variable number of digits)
    const prefixMatch = phoneNumber.match(/^\+\d+/);
    if (prefixMatch) {
      // Extract the prefix
      const prefix = prefixMatch[0];
      // Determine how to format the prefix based on the maskPrefix parameter
      const formattedPrefix = maskPrefix
        ? `+{${'0'.repeat(prefix.length - 1)}}` // Replace prefix digits with 0s
        : `+{${prefix.slice(1)}}`; // Keep the original prefix digits
      // Extract the rest of the phone number
      const restOfNumber = phoneNumber.slice(prefix.length);
      // Replace all digits in the rest of the phone number with zeros
      const maskedNumber = restOfNumber.replace(/\d/g, '0');
      // Combine the formatted prefix with the masked number
      return `${formattedPrefix}${maskedNumber}`;
    }
    // If no prefix is found, replace all digits in the entire phone number
    return phoneNumber.replace(/\d/g, '0');
  }
}
