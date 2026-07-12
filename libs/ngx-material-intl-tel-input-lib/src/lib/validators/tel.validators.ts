import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import {
  CountryCode,
  parsePhoneNumberWithError,
  validatePhoneNumberLength
} from 'libphonenumber-js';

/**
 * Validates a phone number value (in any international format) without side effects.
 *
 * @param value - The phone number to validate.
 * @param countryIso - ISO2 code of the currently selected country, used for the length check.
 *                     Falls back to the country detected from the number itself.
 * @returns A validation error map, or null when the number is valid.
 */
export const validatePhoneNumber = (
  value: string | null | undefined,
  countryIso?: string
): ValidationErrors | null => {
  if (!value) {
    return null;
  }
  const region = countryIso?.toUpperCase() as CountryCode | undefined;
  if (validatePhoneNumberLength(value, region) === 'TOO_LONG') {
    return { numberTooLong: true };
  }
  try {
    const parsed = parsePhoneNumberWithError(value, region);
    if (!parsed.isValid()) {
      return { invalidNumber: true };
    }
    return null;
  } catch {
    return { invalidNumber: true };
  }
};

export default class TelValidators {
  /**
   * Returns a pure validator for international phone numbers.
   * Formatting the input and syncing the selected country are handled by the
   * component's value-changes pipeline, not here: a validator must not mutate
   * form state or overwrite errors set by other validators.
   *
   * @param getCountryIso - Optional getter for the currently selected country ISO2 code.
   */
  static isValidNumber(getCountryIso?: () => string | undefined): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null =>
      validatePhoneNumber(control.value, getCountryIso?.());
  }
}
