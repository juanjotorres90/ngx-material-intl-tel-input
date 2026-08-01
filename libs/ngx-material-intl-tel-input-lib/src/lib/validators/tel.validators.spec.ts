import type { MockInstance } from 'vitest';
import { FormControl } from '@angular/forms';

import TelValidators from './tel.validators';
import { phoneNumberUtils } from '../utils/phone-number.utils';

/**
 * The validator reads nothing but the control's value: the selected country and
 * the visible country list no longer take part. Country resolution lives in
 * `country.utils.ts` and is covered by its own spec.
 */
describe('TelValidators', () => {
  let control: FormControl;
  let mockIsValidPhoneNumberLength: MockInstance<
    typeof phoneNumberUtils.isValidPhoneNumberLength
  >;

  beforeEach(() => {
    // vi.mock on relative imports is unsupported by the Angular unit-test
    // builder, so spy on the phoneNumberUtils object the validator calls into
    mockIsValidPhoneNumberLength = vi.spyOn(
      phoneNumberUtils,
      'isValidPhoneNumberLength'
    );

    control = new FormControl('');

    vi.clearAllMocks();
    mockIsValidPhoneNumberLength.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isValidNumber', () => {
    describe('with valid phone numbers', () => {
      it('should return null for valid US phone number', () => {
        control.setValue('+1 201 555 0123');

        expect(TelValidators.isValidNumber()(control)).toBeNull();
        expect(control.errors).toBeNull();
      });

      it('should return null for valid UK phone number', () => {
        control.setValue('+44 7400 123456');

        expect(TelValidators.isValidNumber()(control)).toBeNull();
      });

      it('should return null for valid Swiss phone number', () => {
        control.setValue('+41 78 123 45 67');

        expect(TelValidators.isValidNumber()(control)).toBeNull();
      });

      it('should return null for a territory sharing a calling code', () => {
        control.setValue('+1 767 225 1234');

        expect(TelValidators.isValidNumber()(control)).toBeNull();
      });

      it('should handle empty/null values gracefully', () => {
        control.setValue('');

        expect(TelValidators.isValidNumber()(control)).toBeNull();
      });

      it('should handle null control value', () => {
        control.setValue(null);

        expect(TelValidators.isValidNumber()(control)).toBeNull();
      });

      it('should handle undefined control value', () => {
        control.setValue(undefined);

        expect(TelValidators.isValidNumber()(control)).toBeNull();
      });
    });

    describe('with invalid phone numbers', () => {
      it('should return invalidNumber error for invalid phone number', () => {
        control.setValue('+1 123'); // Too short

        expect(TelValidators.isValidNumber()(control)).toEqual({
          invalidNumber: true
        });
      });

      it('should return invalidNumber error for completely invalid format', () => {
        control.setValue('abc123');

        expect(TelValidators.isValidNumber()(control)).toEqual({
          invalidNumber: true
        });
      });

      it('should handle parsing errors gracefully', () => {
        control.setValue('invalid-phone-number-format');

        expect(TelValidators.isValidNumber()(control)).toEqual({
          invalidNumber: true
        });
      });

      it('should handle whitespace-only control value', () => {
        control.setValue('   ');

        expect(TelValidators.isValidNumber()(control)).toEqual({
          invalidNumber: true
        });
      });

      it('should handle very long invalid numbers', () => {
        control.setValue('+1 123456789012345678901234567890');

        expect(TelValidators.isValidNumber()(control)).toEqual({
          invalidNumber: true
        });
      });

      it('should reject an international format without a plus sign', () => {
        control.setValue('1 201 555 0123');

        expect(TelValidators.isValidNumber()(control)).toEqual({
          invalidNumber: true
        });
      });

      it('should reach a verdict for numbers with special characters', () => {
        control.setValue('+1 (201) 555-0123 ext. 123');

        expect(TelValidators.isValidNumber()(control)).toBeDefined();
      });
    });

    describe('length validation', () => {
      it('should return numberTooLong when the number exceeds its maximum length', () => {
        mockIsValidPhoneNumberLength.mockReturnValue(false);
        control.setValue('+1 201 555 0123');

        expect(TelValidators.isValidNumber()(control)).toEqual({
          numberTooLong: true
        });
      });

      it('should measure the number against its own country, not the selected one', () => {
        control.setValue('+41 78 123 45 67');

        TelValidators.isValidNumber()(control);

        expect(mockIsValidPhoneNumberLength).toHaveBeenCalledWith(
          '+41 78 123 45 67',
          'CH'
        );
      });

      it('should measure a shared calling code against the territory it belongs to', () => {
        control.setValue('+1 767 225 1234');

        TelValidators.isValidNumber()(control);

        expect(mockIsValidPhoneNumberLength).toHaveBeenCalledWith(
          '+1 767 225 1234',
          'DM'
        );
      });

      it('should not report a valid number as too long because another country is selected', () => {
        // the real length check, no spy: a Chinese number is 11 national digits,
        // far past the budget of the short-numbered country a consumer may have
        // selected while 'cn' is excluded from the visible list
        mockIsValidPhoneNumberLength.mockRestore();
        control.setValue('+86 138 0013 8000');

        expect(TelValidators.isValidNumber()(control)).toBeNull();
        expect(
          phoneNumberUtils.isValidPhoneNumberLength('+86 138 0013 8000', 'sh')
        ).toBe(false);
      });

      it('should accept a non-geographical number, which belongs to no country', () => {
        // '001' has no example number to derive a budget from, so the E.164
        // maximum applies instead of a country's
        mockIsValidPhoneNumberLength.mockRestore();
        control.setValue('+979 123456789');

        expect(TelValidators.isValidNumber()(control)).toBeNull();
      });

      it('should prioritize libphonenumber validation over length validation', () => {
        mockIsValidPhoneNumberLength.mockReturnValue(false);
        control.setValue('+1 123'); // Invalid according to libphonenumber

        // Should return invalidNumber (from libphonenumber) not numberTooLong
        expect(TelValidators.isValidNumber()(control)).toEqual({
          invalidNumber: true
        });
        expect(mockIsValidPhoneNumberLength).not.toHaveBeenCalled();
      });
    });
  });
});
