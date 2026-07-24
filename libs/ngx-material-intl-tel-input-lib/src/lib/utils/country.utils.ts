import {
  PhoneNumber,
  PhoneNumberFormat,
  PhoneNumberUtil
} from 'google-libphonenumber';
import { Country } from '../types/country.model';

/**
 * Country rules shared by the component and the reactive-forms validator, so a
 * change to either one cannot drift between them.
 */

/**
 * Finds the country matching a parsed phone number's country code,
 * considering area codes and country priority.
 *
 * @param parsedNumber Parsed phone number
 * @param allCountries Country list to search
 * @returns The matching country, or undefined when none applies
 */
export const findCountryByParsedNumber = (
  parsedNumber: PhoneNumber,
  allCountries: Country[],
  countryCode: string | number | undefined = parsedNumber.getCountryCode()
): Country | undefined => {
  return allCountries?.find((c) => {
    if (c.dialCode === countryCode?.toString()) {
      if (c.areaCodes) {
        // Checking the area codes only works because the countries using the same country code as the
        // US (+1) and UK (+44) are ALL defined earlier in the list of all countries (country-code.ts)
        // and are checked before defaulting to the US or UK (which are defined without area codes and
        // have the highest priority (0)).
        return c.areaCodes?.find((ac) =>
          parsedNumber.getNationalNumber()?.toString().startsWith(ac)
        );
      } else if (c.priority === 0) {
        // If a country does NOT have any area codes but shares a country code with another country,
        // return the country with the highest priority (0), eg. country code '599' belongs to both
        // 'Carribean Netherlands' (priority 1) and 'Curaçao' (priority 0).
        return c;
      }
    }
    return undefined;
  });
};

/**
 * Formats a parsed number the way the number input displays it: the configured
 * output format when the dial code is part of the input (or for Northern
 * Mariana Islands, whose national format drops the +1 670 prefix), national
 * format otherwise.
 *
 * @param parsedNumber Parsed phone number
 * @param options Selected country ISO2 and output configuration
 * @returns The formatted number for the input field
 */
export const formatForNumberInput = (
  parsedNumber: PhoneNumber,
  options: {
    includeDialCode: boolean;
    iso2?: string;
    outputNumberFormat: PhoneNumberFormat;
  }
): string =>
  PhoneNumberUtil.getInstance().format(
    parsedNumber,
    options.includeDialCode || options.iso2 === 'mp'
      ? options.outputNumberFormat
      : PhoneNumberFormat.NATIONAL
  );

/**
 * Object wrapper so consumers call these as methods, which keeps them spyable
 * in tests (vi.mock is not supported for relative imports under the Angular
 * unit-test builder).
 */
export const countryUtils = {
  findCountryByParsedNumber,
  formatForNumberInput
};
