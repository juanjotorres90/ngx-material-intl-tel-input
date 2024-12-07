import { Injectable } from '@angular/core';
import { Country } from '../../types/country.model';
import {
  PhoneNumberFormat,
  PhoneNumberType,
  PhoneNumberUtil
} from 'google-libphonenumber';
import { CountryCode, CountryData } from '../../data/country-code';
import { CountryISO } from '../../enums/country-iso.enum';

@Injectable()
export class CountryDataService {
  phoneNumberUtil = PhoneNumberUtil.getInstance();

  /**
   * Retrieves a Country object based on the provided country data and placeholder flag.
   *
   * @param {CountryData} countryData - the country data used to create the Country object
   * @param {boolean} enablePlaceholder - a flag indicating whether to include a placeholder value
   * @return {Country} the generated Country object
   */
  private getCountryObject(
    countryData: CountryData,
    enablePlaceholder: boolean,
    includeDialCode: boolean,
    useMask: boolean,
    forceSelectedCountryCode: boolean,
    showMaskPlaceholder: boolean
  ): Country {
    const phoneNumberPlaceholder = this.getPhoneNumberPlaceholder(
      countryData[2].toString().toUpperCase(),
      includeDialCode
    );
    const country: Country = {
      emojiFlag: countryData[0].toString(),
      name: countryData[1].toString(),
      iso2: countryData[2].toString(),
      dialCode: countryData[3].toString(),
      priority: (countryData?.[4] && +countryData[4]) || 0,
      areaCodes: (countryData[5] as string[]) || undefined,
      htmlId: `country-code__${countryData[2].toString()}`,
      flagClass: `country-code__${countryData[2].toString().toLocaleLowerCase()}`,
      placeHolder: enablePlaceholder ? phoneNumberPlaceholder : ''
    };
    if (useMask) {
      let mask = '';
      if (forceSelectedCountryCode) {
        mask = this.formatPhoneNumberWithPrefix(phoneNumberPlaceholder, false);
      } else {
        mask = this.formatPhoneNumberWithPrefix(phoneNumberPlaceholder, true);
      }
      country.mask = {
        mask: mask,
        lazy: !showMaskPlaceholder
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
    preferredCountries?: string[]
  ): Country[] {
    if (preferredCountries?.length) {
      return allCountries.sort((a, b) => {
        if (
          preferredCountries.includes(a.iso2) &&
          !preferredCountries.includes(b.iso2)
        ) {
          return -1;
        } else if (
          !preferredCountries.includes(a.iso2) &&
          preferredCountries.includes(b.iso2)
        ) {
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
    includeDialCode: boolean
  ): string {
    try {
      return this.phoneNumberUtil.format(
        this.phoneNumberUtil.getExampleNumberForType(
          countryCode,
          PhoneNumberType.MOBILE
        ),
        includeDialCode || countryCode === 'MP'
          ? PhoneNumberFormat.INTERNATIONAL
          : PhoneNumberFormat.NATIONAL
      );
    } catch {
      return '';
    }
  }

  /**
   * Process the list of countries based on the provided data and parameters.
   *
   * @param {CountryCode} countryCodeData - the data containing country codes
   * @param {boolean} enablePlaceholder - flag to enable placeholder
   * @param {(CountryISO | string)[]} [visibleCountries] - optional array of visible country ISO codes or country names
   * @param {(CountryISO | string)[]} [preferredCountries] - optional array of preferred country ISO codes or country names
   * @param {(CountryISO | string)[]} [excludedCountries] - optional array of excluded country ISO codes or country names
   * @return {Country[]} the processed and sorted list of countries
   */
  processCountries(
    countryCodeData: CountryCode,
    enablePlaceholder: boolean,
    includeDialCode: boolean,
    visibleCountries?: (CountryISO | string)[],
    preferredCountries?: (CountryISO | string)[],
    excludedCountries?: (CountryISO | string)[],
    useMask = false,
    forceSelectedCountryCode = false,
    showMaskPlaceholder = false
  ): Country[] {
    const allCountries: Country[] = countryCodeData.allCountries.map(
      (countryData: CountryData) =>
        this.getCountryObject(
          countryData,
          enablePlaceholder,
          includeDialCode,
          useMask,
          forceSelectedCountryCode,
          showMaskPlaceholder
        )
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
    const sortedCountries = this.sortCountries(
      filteredCountries,
      preferredCountries
    );
    return sortedCountries;
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
