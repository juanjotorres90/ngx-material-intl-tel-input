import { AbstractControl, FormGroup, ValidatorFn } from '@angular/forms';
import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';

export default class TelValidators {
  static isValidNumber(telForm: FormGroup): ValidatorFn {
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

        const formattedOnlyNumber = phoneNumberUtil.format(
          parsed,
          PhoneNumberFormat.NATIONAL
        );
        telForm
          .get('numberControl')
          ?.setValue(formattedOnlyNumber, { emitEvent: false });

        const isValidNumber = phoneNumberUtil.isValidNumber(parsed);
        if (!isValidNumber) {
          return {
            invalidNumber: true
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
