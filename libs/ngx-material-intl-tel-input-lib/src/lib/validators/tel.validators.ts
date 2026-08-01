import { AbstractControl, ValidatorFn } from '@angular/forms';
import { PhoneNumberUtil } from 'google-libphonenumber';
import { phoneNumberUtils } from '../utils/phone-number.utils';

export default class TelValidators {
  /**
   * Validates the international number held by a control.
   *
   * The verdict depends on the number alone, never on the selected country or
   * on which countries are visible: both checks read the number's own country
   * out of the value. Repainting the country selector and the number input
   * belongs to the component (`applyValueToTelForm`), so those writes happen
   * where the caller can see them instead of inside a validation pass.
   */
  static isValidNumber(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      try {
        const phoneNumberUtil = PhoneNumberUtil.getInstance();

        if (!control.value) {
          return null;
        }

        // NOTE: territories sharing a calling code (Dominica, Grenada, Northern
        // Mariana Islands, ...) parse to that shared code with the area code
        // kept in the national number, which is why the region below comes from
        // libphonenumber rather than from getCountryCode() alone.
        const parsed = phoneNumberUtil.parse(control.value);

        if (!phoneNumberUtil.isValidNumber(parsed)) {
          return {
            invalidNumber: true
          };
        }

        // The length budget belongs to the number's own country. Measuring it
        // against the selected one reported a valid number as too long whenever
        // the two disagreed — a number whose country is excluded from the list,
        // for instance, was measured against whatever happened to be selected.
        const region = phoneNumberUtil.getRegionCodeForNumber(parsed);
        if (
          region &&
          !phoneNumberUtils.isValidPhoneNumberLength(control.value, region)
        ) {
          // Valid according to libphonenumber, but longer than the country's
          // example number allows for.
          return {
            numberTooLong: true
          };
        }

        return null;
      } catch {
        return {
          invalidNumber: true
        };
      }
    };
  }
}
