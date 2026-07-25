import { AbstractControl, FormGroup, ValidatorFn } from '@angular/forms';
import { PhoneNumberUtil } from 'google-libphonenumber';
import { Country } from '../types/country.model';
import { phoneNumberUtils } from '../utils/phone-number.utils';
import { countryUtils } from '../utils/country.utils';

export default class TelValidators {
  /**
   * Validates the number held by a control.
   *
   * This validator is pure: it reads the selected country from `telForm` but
   * writes nothing. Repainting the country selector and the number input from
   * a value belongs to the component (`applyValueToTelForm`), so those writes
   * happen where the caller can see them instead of inside a validation pass.
   *
   * @param telForm Form holding the country selector and the number input
   * @param includeDialCode Whether the dial code is part of the number input
   * @param allCountries Country list to resolve the number against
   */
  static isValidNumber(
    telForm: FormGroup,
    includeDialCode = false,
    allCountries: Country[]
  ): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      try {
        const phoneNumberUtil = PhoneNumberUtil.getInstance();

        if (!control.value) {
          return null;
        }

        // NOTE: territories sharing a calling code (Dominica, Grenada, Northern
        // Mariana Islands, ...) parse to that shared code with the area code
        // kept in the national number, so the country is resolved from the area
        // code afterwards rather than from getCountryCode() alone.
        const parsed = phoneNumberUtil.parse(control.value);

        // The length check runs against the country the selector ends up on,
        // which is what resolveCountrySequence replays without writing.
        const { finalIso } = countryUtils.resolveCountrySequence(
          parsed,
          allCountries,
          {
            includeDialCode,
            currentIso: telForm?.value?.prefixCtrl?.iso2,
            currentDialCode: telForm?.value?.prefixCtrl?.dialCode
          }
        );

        const isValidNumber = phoneNumberUtil.isValidNumber(parsed);

        // Check if the phone number length is valid for the country
        const isValidLength = finalIso
          ? phoneNumberUtils.isValidPhoneNumberLength(control.value, finalIso)
          : true;

        if (!isValidNumber) {
          return {
            invalidNumber: true
          };
        } else if (!isValidLength) {
          // If the number is valid according to libphonenumber but exceeds the maximum length
          return {
            numberTooLong: true
          };
        } else {
          return null;
        }
      } catch {
        return {
          invalidNumber: true
        };
      }
    };
  }
}
