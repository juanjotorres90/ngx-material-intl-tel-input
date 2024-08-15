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

        // NOTE: the PhoneNumberUtil.parse() method does NOT appear to correctly parse phone numbers with
        // country codes which include the 'area code' eg. Dominica (+1767), Grenada (+1473), etc.
        // Instead, the returned phone number is for the US (+1) country code.
        const parsed = phoneNumberUtil.parse(control.value);

        const setPrefixControlValue = (
          countryCode: string | number | undefined,
          allCountries: Country[],
          telForm: FormGroup
        ) => {
          const country = allCountries.find((c) => {
            if (c.dialCode === countryCode?.toString()) {
              if (c.areaCodes) {
                // Checking the area codes only works because the countries using the same country code as the
                // US (+1) and UK (+44) are ALL defined earlier in the list of all countries (country-code.ts)
                // and are checked before defaulting to the US or UK (which are defined without area codes and
                // have the highest priority (0)).
                return c.areaCodes?.find((ac) =>
                  parsed.getNationalNumber()?.toString().startsWith(ac)
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
        setPrefixControlValue(parsed.getCountryCode(), allCountries, telForm);
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
