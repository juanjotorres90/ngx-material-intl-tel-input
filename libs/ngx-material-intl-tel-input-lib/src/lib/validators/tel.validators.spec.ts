import { FormControl } from '@angular/forms';
import TelValidators, { validatePhoneNumber } from './tel.validators';

describe('TelValidators', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('validatePhoneNumber', () => {
    it('should return null for valid phone numbers', () => {
      expect(validatePhoneNumber('+12015550123')).toBeNull();
      expect(validatePhoneNumber('+447400123456')).toBeNull();
      expect(validatePhoneNumber('+41781234567')).toBeNull();
    });

    it('should return null for empty values', () => {
      expect(validatePhoneNumber('')).toBeNull();
      expect(validatePhoneNumber(null)).toBeNull();
      expect(validatePhoneNumber(undefined)).toBeNull();
    });

    it('should return invalidNumber for invalid phone numbers', () => {
      expect(validatePhoneNumber('+1201555')).toEqual({ invalidNumber: true });
    });

    it('should return invalidNumber for unparseable input', () => {
      expect(validatePhoneNumber('not-a-number')).toEqual({
        invalidNumber: true
      });
      expect(validatePhoneNumber('2015550123')).toEqual({
        invalidNumber: true
      });
    });

    it('should return numberTooLong for an actually excessive number', () => {
      expect(validatePhoneNumber('+12015550123456789', 'us')).toEqual({
        numberTooLong: true
      });
    });

    it('should prioritize number validity over the length check', () => {
      expect(validatePhoneNumber('not-a-number', 'us')).toEqual({
        invalidNumber: true
      });
    });

    it('should fall back to the country detected from the number itself', () => {
      expect(validatePhoneNumber('+12015550123')).toBeNull();
    });

    it('should validate national input when a country is provided', () => {
      expect(validatePhoneNumber('2015550123', 'us')).toBeNull();
    });
  });

  describe('isValidNumber', () => {
    it('should validate the control value without mutating any form state', () => {
      const control = new FormControl('+12015550123');
      const validator = TelValidators.isValidNumber(() => 'us');

      expect(validator(control)).toBeNull();
      expect(control.value).toBe('+12015550123');
      expect(control.errors).toBeNull();
    });

    it('should return errors for invalid values', () => {
      const control = new FormControl('+1201555');
      const validator = TelValidators.isValidNumber();

      expect(validator(control)).toEqual({ invalidNumber: true });
    });

    it('should read the selected country from the getter', () => {
      const getCountryIso = jest.fn().mockReturnValue('ch');
      const control = new FormControl('+41781234567');
      const validator = TelValidators.isValidNumber(getCountryIso);

      expect(validator(control)).toBeNull();
      expect(getCountryIso).toHaveBeenCalled();
    });

    it('should not overwrite errors set by other validators', () => {
      const control = new FormControl('', {
        validators: [() => ({ customError: true })]
      });
      const validator = TelValidators.isValidNumber();
      control.updateValueAndValidity();

      expect(validator(control)).toBeNull();
      expect(control.errors).toEqual({ customError: true });
    });
  });
});
