import {
  CountryCode,
  getExampleNumber,
  NumberFormat,
  PhoneNumber,
  validatePhoneNumberLength
} from 'libphonenumber-js';
import * as mobileExamplesModule from 'libphonenumber-js/mobile/examples';
import {
  LegacyPhoneNumberFormat,
  normalizePhoneNumberFormat,
  PhoneNumberFormat
} from '../enums/phone-number-format.enum';

// Unwrap the CJS/ESM interop difference: the ESM build exposes the examples on
// `.default`, while the CJS build (used by Jest) resolves to the raw JSON object.
type MobileExamples = typeof mobileExamplesModule.default;
const examples: MobileExamples =
  (mobileExamplesModule as { default?: MobileExamples }).default ??
  (mobileExamplesModule as unknown as MobileExamples);

// Default reasonable maximum length based on international standards.
// Most countries have maximum phone numbers between 10-15 digits.
const DEFAULT_MAX_LENGTH = 15;

const maxLengthCache = new Map<string, number>();

/**
 * Returns the example mobile number for a country, or undefined when the
 * country is unknown.
 *
 * @param {string} countryCode - ISO2 country code, any casing.
 */
export const getExampleMobileNumber = (
  countryCode: string
): PhoneNumber | undefined => {
  try {
    return getExampleNumber(countryCode.toUpperCase() as CountryCode, examples);
  } catch {
    return undefined;
  }
};

/**
 * Formats a parsed phone number using the library's PhoneNumberFormat enum.
 *
 * @param {PhoneNumber} phoneNumber - The parsed phone number.
 * @param {PhoneNumberFormat} format - The desired output format.
 * @returns {string} The formatted phone number.
 */
export const formatPhoneNumber = (
  phoneNumber: PhoneNumber,
  format: PhoneNumberFormat | LegacyPhoneNumberFormat
): string =>
  phoneNumber.format(normalizePhoneNumberFormat(format) as NumberFormat);

/**
 * Gets the maximum allowed length for a country's phone number.
 *
 * @param {string} countryCode - ISO2 country code (e.g., 'CH' for Switzerland)
 * @returns {number} The maximum allowed length for the country's national number
 */
export const getMaxPhoneNumberLength = (countryCode?: string): number => {
  if (!countryCode) {
    return DEFAULT_MAX_LENGTH;
  }
  const iso = countryCode.toUpperCase();
  const cached = maxLengthCache.get(iso);
  if (cached) {
    return cached;
  }
  let maxLength = DEFAULT_MAX_LENGTH;
  const exampleNumber = getExampleMobileNumber(iso);
  if (exampleNumber) {
    // Small buffer to accommodate longer number types than the mobile example
    maxLength = exampleNumber.nationalNumber.length + 3;
  }
  maxLengthCache.set(iso, maxLength);
  return maxLength;
};

/**
 * Validates if a phone number exceeds the maximum allowed length for its country.
 *
 * @param {string} phoneNumber - Full phone number with country code
 * @param {string} countryCode - ISO2 country code (e.g., 'CH' for Switzerland)
 * @returns {boolean} True if the phone number is valid length, false if it exceeds maximum length
 */
export const isValidPhoneNumberLength = (
  phoneNumber: string,
  countryCode: string
): boolean => {
  const result = validatePhoneNumberLength(
    phoneNumber,
    countryCode?.toUpperCase() as CountryCode
  );
  // Only "too long" (or unparseable input) fails this check; short numbers are
  // reported by the number validity check instead.
  return (
    result === undefined ||
    result === 'TOO_SHORT' ||
    result === 'INVALID_LENGTH'
  );
};
