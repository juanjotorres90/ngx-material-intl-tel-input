import { AbstractControl, FormGroup, ValidatorFn } from '@angular/forms';
import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';
import { Country } from '../types/country.model';

export default class TelValidators {
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

        const parsed = phoneNumberUtil.parse(
          control.value,
          telForm?.value?.prefixCtrl?.iso2
        );

        const setPrefixControlValue = (
          countryCode: string | number | undefined,
          allCountries: Country[],
          telForm: FormGroup
        ) => {
          const country = allCountries.find(
            (c) => c.dialCode === countryCode?.toString()
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

        const formattedOnlyNumber = phoneNumberUtil.format(
          parsed,
          includeDialCode || telForm?.value?.prefixCtrl?.iso2 === 'mp'
            ? PhoneNumberFormat.INTERNATIONAL
            : PhoneNumberFormat.NATIONAL
        );
        telForm
          .get('numberControl')
          ?.setValue(formattedOnlyNumber, { emitEvent: false });

        const isValidNumber = phoneNumberUtil.isValidNumber(parsed);
        if (
          parsed.getCountryCode() &&
          parsed.getCountryCode()?.toString() !==
            telForm?.value?.prefixCtrl?.dialCode
        ) {
          setPrefixControlValue(parsed.getCountryCode(), allCountries, telForm);
        }
        if (!isValidNumber) {
          control.setErrors({ invalidNumber: true });
          telForm.get('numberControl')?.setErrors({ invalidNumber: true });
          return {
            invalidNumber: true
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
