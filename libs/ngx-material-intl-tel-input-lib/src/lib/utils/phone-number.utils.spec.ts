import {
  formatPhoneNumber,
  getMaxPhoneNumberLength,
  isValidPhoneNumberLength
} from './phone-number.utils';
import { parsePhoneNumberWithError } from 'libphonenumber-js';
import { PhoneNumberFormat } from '../enums/phone-number-format.enum';

describe('Phone Number Utils', () => {
  describe('getMaxPhoneNumberLength', () => {
    it('should return default maximum length of 15 when countryCode is not provided', () => {
      expect(getMaxPhoneNumberLength()).toBe(15);
      expect(getMaxPhoneNumberLength('')).toBe(15);
    });

    it('should return the example number length plus buffer for a valid country', () => {
      // US mobile example number has 10 national digits
      expect(getMaxPhoneNumberLength('US')).toBe(13);
    });

    it('should handle lowercase country codes', () => {
      expect(getMaxPhoneNumberLength('us')).toBe(13);
    });

    it('should return consistent values from the cache', () => {
      expect(getMaxPhoneNumberLength('CH')).toBe(getMaxPhoneNumberLength('ch'));
    });

    it('should return the default length for unknown country codes', () => {
      expect(getMaxPhoneNumberLength('XX')).toBe(15);
    });
  });

  describe('isValidPhoneNumberLength', () => {
    it('should return true for a valid length phone number', () => {
      expect(isValidPhoneNumberLength('+12015550123', 'US')).toBe(true);
    });

    it('should return false for a phone number exceeding maximum length', () => {
      expect(isValidPhoneNumberLength('+1201555012345678', 'US')).toBe(false);
    });

    it('should return true for a too-short number (short numbers are reported by validity, not length)', () => {
      expect(isValidPhoneNumberLength('+1201', 'US')).toBe(true);
    });

    it('should return false for unparseable input', () => {
      expect(isValidPhoneNumberLength('invalid-phone', 'US')).toBe(false);
      expect(isValidPhoneNumberLength('', 'US')).toBe(false);
    });

    it('should work with different country codes', () => {
      expect(isValidPhoneNumberLength('+41781234567', 'CH')).toBe(true);
    });
  });

  describe('formatPhoneNumber', () => {
    const parsed = parsePhoneNumberWithError('+12015550123');

    it('should format using the library PhoneNumberFormat enum', () => {
      expect(formatPhoneNumber(parsed, PhoneNumberFormat.E164)).toBe(
        '+12015550123'
      );
      expect(formatPhoneNumber(parsed, PhoneNumberFormat.INTERNATIONAL)).toBe(
        '+1 201 555 0123'
      );
      expect(formatPhoneNumber(parsed, PhoneNumberFormat.NATIONAL)).toBe(
        '(201) 555-0123'
      );
      expect(formatPhoneNumber(parsed, PhoneNumberFormat.RFC3966)).toBe(
        'tel:+12015550123'
      );
    });

    it('should support legacy google-libphonenumber enum values', () => {
      expect(formatPhoneNumber(parsed, 0)).toBe('+12015550123');
      expect(formatPhoneNumber(parsed, 1)).toBe('+1 201 555 0123');
      expect(formatPhoneNumber(parsed, 2)).toBe('(201) 555-0123');
      expect(formatPhoneNumber(parsed, 3)).toBe('tel:+12015550123');
    });
  });
});
