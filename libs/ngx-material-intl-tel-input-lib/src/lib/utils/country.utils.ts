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
 * The national format drops the calling code, and the selected country is what
 * puts it back when the value is rebuilt. So it is only used while the
 * selection is the number's own country. When it is not — the number's country
 * is filtered out of the list, or none is selected — the calling code is kept,
 * because dropping it would rebuild the number under an unrelated country or
 * lose its country altogether.
 *
 * @param parsedNumber Parsed phone number
 * @param options Output configuration, plus the selected country's dial code
 * @returns The formatted number for the input field
 */
export const formatForNumberInput = (
  parsedNumber: PhoneNumber,
  options: {
    includeDialCode: boolean;
    outputNumberFormat: PhoneNumberFormat;
    /** dial code of the selected country, or undefined when none is selected */
    selectedDialCode: string | undefined;
  }
): string => {
  const nationalFormatRoundTrips =
    options.selectedDialCode === parsedNumber.getCountryCode()?.toString();
  return PhoneNumberUtil.getInstance().format(
    parsedNumber,
    options.includeDialCode || !nationalFormatRoundTrips
      ? options.outputNumberFormat
      : PhoneNumberFormat.NATIONAL
  );
};

/**
 * True while the parsed national number is still a strict prefix of one of the
 * selected country's area codes, meaning the user is editing inside the area
 * code itself. Such a number identifies no country yet, so the current
 * selection has to survive: without this, deleting into a prefilled area code
 * (`+1 876` to `+1 87`) resolves to the priority-0 country sharing the calling
 * code and silently reassigns the country the user picked.
 *
 * The calling codes must match, otherwise a number from elsewhere would be
 * held back by a selection it has nothing to do with.
 *
 * @param parsedNumber Parsed phone number
 * @param country The currently selected country, when there is one
 * @returns Whether the number is an unfinished form of the selected country's
 */
const isIncompleteAreaCode = (
  parsedNumber: PhoneNumber,
  country: Country | undefined
): boolean => {
  if (
    !country ||
    country.dialCode !== parsedNumber.getCountryCode()?.toString()
  ) {
    return false;
  }
  const nationalNumber = parsedNumber.getNationalNumber()?.toString() ?? '';
  return !!country.areaCodes?.some(
    (areaCode) =>
      nationalNumber.length < areaCode.length &&
      areaCode.startsWith(nationalNumber)
  );
};

/** Countries a value resolves to, in the order the form applies them. */
export interface CountrySequence {
  /** resolved from the selected dial code, only when includeDialCode is set */
  fromDialCode?: Country;
  /** resolved from the parsed number's own country code */
  fromParsed?: Country;
}

/**
 * Resolves the country twice, in the order the form applies it: first from the
 * selected dial code (only with `includeDialCode`), then from the parsed
 * number's country code. The two can disagree — a +1 number while a different
 * +1 country is selected, or a country switch with the dial code in the input —
 * and the number is formatted between them, so the order is part of the
 * behavior rather than an implementation detail.
 *
 * This is a pure replay: nothing is written, the caller decides what to apply.
 * An empty sequence means the selection stays where it is.
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
  const currentCountry = options.currentIso
    ? allCountries?.find((country) => country?.iso2 === options.currentIso)
    : undefined;
  if (isIncompleteAreaCode(parsedNumber, currentCountry)) {
    // the selection already holds the only country this number can still
    // become, so there is nothing to resolve or write
    return {};
  }

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
    }
  }

  return {
    fromDialCode,
    fromParsed: findCountryByParsedNumber(parsedNumber, allCountries)
  };
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
