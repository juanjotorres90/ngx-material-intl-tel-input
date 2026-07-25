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
 * output format when the dial code is part of the input, national format
 * otherwise.
 *
 * The selected country does not take part: the parsed number already carries
 * its own country, so the selection cannot change the rendering.
 *
 * @param parsedNumber Parsed phone number
 * @param options Output configuration
 * @returns The formatted number for the input field
 */
export const formatForNumberInput = (
  parsedNumber: PhoneNumber,
  options: {
    includeDialCode: boolean;
    outputNumberFormat: PhoneNumberFormat;
  }
): string =>
  PhoneNumberUtil.getInstance().format(
    parsedNumber,
    options.includeDialCode
      ? options.outputNumberFormat
      : PhoneNumberFormat.NATIONAL
  );

/** Countries a value resolves to, and the ISO2 the form ends up on. */
export interface CountrySequence {
  /** resolved from the selected dial code, only when includeDialCode is set */
  fromDialCode?: Country;
  /** resolved from the parsed number's own country code */
  fromParsed?: Country;
  /** the iso2 the selector holds once both resolutions have been applied */
  finalIso?: string;
}

/**
 * Resolves the country twice, in the order the form applies it: first from the
 * selected dial code (only with `includeDialCode`), then from the parsed
 * number's country code. The two can disagree — a +1 number while a different
 * +1 country is selected, or a country switch with the dial code in the input —
 * and the number is formatted between them, so the order is part of the
 * behavior rather than an implementation detail.
 *
 * This is a pure replay: the caller decides what to write, and the validator
 * uses `finalIso` to reach the same verdict it would have reached after those
 * writes.
 */
export const resolveCountrySequence = (
  parsedNumber: PhoneNumber,
  allCountries: Country[],
  options: {
    includeDialCode: boolean;
    currentIso?: string;
    currentDialCode?: string;
  }
): CountrySequence => {
  let finalIso = options.currentIso;
  let fromDialCode: Country | undefined;

  if (options.includeDialCode) {
    const countryDialCode =
      options.currentDialCode || parsedNumber.getCountryCode();
    if (countryDialCode) {
      fromDialCode = findCountryByParsedNumber(
        parsedNumber,
        allCountries,
        countryDialCode
      );
      if (fromDialCode) {
        finalIso = fromDialCode.iso2;
      }
    }
  }

  const fromParsed = findCountryByParsedNumber(parsedNumber, allCountries);
  if (fromParsed) {
    finalIso = fromParsed.iso2;
  }

  return { fromDialCode, fromParsed, finalIso };
};

/**
 * Object wrapper so consumers call these as methods, which keeps them spyable
 * in tests (vi.mock is not supported for relative imports under the Angular
 * unit-test builder).
 */
export const countryUtils = {
  findCountryByParsedNumber,
  formatForNumberInput,
  resolveCountrySequence
};
