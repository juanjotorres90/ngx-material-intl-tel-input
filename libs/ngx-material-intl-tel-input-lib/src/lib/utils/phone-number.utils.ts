import { PhoneNumberType, PhoneNumberUtil } from 'google-libphonenumber';

/**
 * Gets the maximum allowed length for a country's phone number.
 *
 * @param {string} countryCode - ISO2 country code (e.g., 'CH' for Switzerland)
 * @returns {number} The maximum allowed length for the country's national number
 */
export const getMaxPhoneNumberLength = (countryCode?: string): number => {
  try {
    const phoneNumberUtil = PhoneNumberUtil.getInstance();

    // Default reasonable maximum length based on international standards
    // Most countries have maximum phone numbers between 10-15 digits
    const DEFAULT_MAX_LENGTH = 15;

    if (!countryCode) {
      return DEFAULT_MAX_LENGTH;
    }

    // Get example numbers for different types to analyze the pattern
    const exampleNumberTypes = [
      PhoneNumberType.MOBILE,
      PhoneNumberType.FIXED_LINE,
      PhoneNumberType.FIXED_LINE_OR_MOBILE
    ];

    let maxObservedLength = 0;

    // Check the length of example numbers for different types
    for (const numberType of exampleNumberTypes) {
      try {
        const exampleNumber = phoneNumberUtil.getExampleNumberForType(
          countryCode.toUpperCase(),
          numberType
        );

        if (exampleNumber) {
          const nationalNumber =
            exampleNumber.getNationalNumber()?.toString() || '';
          maxObservedLength = Math.max(
            maxObservedLength,
            nationalNumber.length
          );
        }
      } catch (_) {
        // Continue to the next type if this one fails
      }
    }

    if (maxObservedLength > 0) {
      // Add a small buffer to accommodate variations (e.g., extensions)
      return maxObservedLength + 3;
    }

    return DEFAULT_MAX_LENGTH;
  } catch {
    return 15; // Fallback to reasonable default
  }
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
  try {
    const phoneNumberUtil = PhoneNumberUtil.getInstance();

    // Parse the phone number to get its national number portion
    const parsedNumber = phoneNumberUtil.parse(phoneNumber, countryCode);
    const nationalNumber = parsedNumber.getNationalNumber()?.toString() || '';

    // Get the maximum allowed length for this country
    const maxLength = getMaxPhoneNumberLength(countryCode);

    // Check if the national number length exceeds the maximum allowed
    // This only checks the actual digits, ignoring formatting characters
    return nationalNumber.length <= maxLength;
  } catch (_) {
    // If parsing fails, consider it invalid
    return false;
  }
};
