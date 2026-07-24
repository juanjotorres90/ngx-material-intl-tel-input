import { AbstractControl, FormGroup, ValidatorFn } from '@angular/forms';
import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';
import { Country } from '../types/country.model';
import { phoneNumberUtils } from '../utils/phone-number.utils';
import { countryUtils } from '../utils/country.utils';

export default class TelValidators {
  static isValidNumber(
    telForm: FormGroup,
    includeDialCode = false,
    allCountries: Country[],
    outputNumberFormat: PhoneNumberFormat = PhoneNumberFormat.INTERNATIONAL
  ): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      try {
        const phoneNumberUtil = PhoneNumberUtil.getInstance();

        if (!control.value) {
          return null;
        }

        // NOTE: the PhoneNumberUtil.parse() method does NOT appear to correctly parse phone numbers with
        // country codes which include the 'area code' eg. Dominica (+1767), Grenada (+1473), etc.
        // Instead, the returned phone number is for the US (+1) country code.
        const parsed = phoneNumberUtil.parse(control.value);

        const setPrefixControlValue = (
          countryCode: string | number | undefined,
          allCountries: Country[],
          telForm: FormGroup
        ) => {
          const country = countryUtils.findCountryByParsedNumber(
            parsed,
            allCountries,
            countryCode
          );
          if (country && country.iso2 !== telForm?.value?.prefixCtrl?.iso2) {
            telForm.get('prefixCtrl')?.setValue(country, { emitEvent: false });
          }
        };
        if (includeDialCode) {
          const countryDialCode =
            telForm?.value?.prefixCtrl?.dialCode || parsed.getCountryCode();
          if (countryDialCode) {
            setPrefixControlValue(countryDialCode, allCountries, telForm);
          }
        }

        const formattedOnlyNumber = countryUtils.formatForNumberInput(parsed, {
          includeDialCode,
          iso2: telForm?.value?.prefixCtrl?.iso2,
          outputNumberFormat
        });
        telForm
          .get('numberControl')
          ?.setValue(formattedOnlyNumber, { emitEvent: false });

        const isValidNumber = phoneNumberUtil.isValidNumber(parsed);
        setPrefixControlValue(parsed.getCountryCode(), allCountries, telForm);

        // Check if the phone number length is valid for the country
        const countryIso = telForm?.value?.prefixCtrl?.iso2;
        const isValidLength = countryIso
          ? phoneNumberUtils.isValidPhoneNumberLength(control.value, countryIso)
          : true;

        if (!isValidNumber) {
          control.setErrors({ invalidNumber: true });
          telForm.get('numberControl')?.setErrors({ invalidNumber: true });
          return {
            invalidNumber: true
          };
        } else if (!isValidLength) {
          // If the number is valid according to libphonenumber but exceeds the maximum length
          control.setErrors({ numberTooLong: true });
          telForm.get('numberControl')?.setErrors({ numberTooLong: true });
          return {
            numberTooLong: true
          };
        } else {
          control.setErrors(null);
          telForm.get('numberControl')?.setErrors(null);
          return null;
        }
      } catch {
        control.setErrors({ invalidNumber: true });
        telForm.get('numberControl')?.setErrors({ invalidNumber: true });
        return {
          invalidNumber: true
        };
      }
    };
  }
}
