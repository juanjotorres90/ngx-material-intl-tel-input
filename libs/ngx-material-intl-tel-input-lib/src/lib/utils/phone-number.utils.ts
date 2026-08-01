import {
  PhoneNumberFormat,
  PhoneNumberType,
  PhoneNumberUtil
} from 'google-libphonenumber';

/** Configuration the input's `maxlength` budget depends on. */
export interface MaxInputLengthOptions {
  /** ISO2 code of the selected country */
  countryCode?: string;
  /** current value of the number input */
  currentValue: string;
  /** dial code of the selected country, without the leading '+' */
  dialCode?: string;
  includeDialCode: boolean;
  outputNumberFormat: PhoneNumberFormat;
}

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

/**
 * Checks if the current number is valid and properly formatted.
 * Valid formatted numbers contain spaces/separators.
 *
 * @param currentValue Current input value
 * @param countryCode ISO2 country code
 * @param options Whether the input already carries the dial code, and the dial
 * code of the selected country when it does not
 * @returns True if number is valid and formatted
 */
export const isCurrentNumberValidAndFormatted = (
  currentValue: string,
  countryCode: string,
  options: { includeDialCode: boolean; dialCode?: string }
): boolean => {
  if (!currentValue || currentValue.length < 3) {
    return false; // Too short to be valid
  }

  try {
    // Try to parse the current value
    const fullNumber = options.includeDialCode
      ? currentValue
      : `+${options.dialCode}${currentValue}`;

    const phoneNumberUtil = PhoneNumberUtil.getInstance();
    const parsedNumber = phoneNumberUtil.parse(fullNumber, countryCode);
    const isValid = phoneNumberUtil.isValidNumber(parsedNumber);

    // Check if the number contains formatting characters (spaces, dashes, etc.)
    const hasFormatting = /[\s\-()]/.test(currentValue);

    return isValid && hasFormatting;
  } catch (_) {
    return false;
  }
};

/**
 * Calculates an appropriate safety margin based on component configuration.
 * Different configurations require different buffer spaces.
 * Uses conservative margins to prevent overly long input that requires JS correction.
 *
 * @returns Calculated safety margin
 */
export const calculateSafetyMargin = (options: {
  includeDialCode: boolean;
  outputNumberFormat: PhoneNumberFormat;
}): number => {
  let safetyMargin = 1; // Reduced base safety margin

  // If dial code is included in the input, we need slightly more space
  // because the user types the dial code along with the number
  if (options.includeDialCode) {
    safetyMargin += 1; // Reduced from 2 to 1
  }

  // Different output formats have different space requirements
  switch (options.outputNumberFormat) {
    case PhoneNumberFormat.RFC3966:
      // RFC3966 format (tel: URI) requires additional space for "tel:" prefix
      safetyMargin += 2; // Reduced from 4 to 2
      break;
    case PhoneNumberFormat.E164:
      // E164 is the most compact format, minimal extra space needed
      safetyMargin += 0; // Reduced from 1 to 0 (only base margin)
      break;
    case PhoneNumberFormat.INTERNATIONAL:
    default:
      // International format includes country code and international formatting
      safetyMargin += 1; // Reduced from 2 to 1
      break;
  }

  return safetyMargin;
};

/**
 * Calculates the formatting buffer needed for a country's phone number formatting.
 * Analyzes example formatted numbers to determine space requirements.
 *
 * @param countryCode ISO2 country code
 * @returns Calculated formatting buffer
 */
export const calculateFormattingBuffer = (countryCode: string): number => {
  try {
    const phoneUtil = PhoneNumberUtil.getInstance();

    // Get example numbers for analysis
    const numberTypes = [
      PhoneNumberType.MOBILE,
      PhoneNumberType.FIXED_LINE,
      PhoneNumberType.FIXED_LINE_OR_MOBILE
    ];

    let maxFormattingOverhead = 0;

    for (const numberType of numberTypes) {
      try {
        const exampleNumber = phoneUtil.getExampleNumberForType(
          countryCode.toUpperCase(),
          numberType
        );

        if (exampleNumber) {
          // Format the number and calculate the overhead
          const formattedNational = phoneUtil.format(
            exampleNumber,
            PhoneNumberFormat.NATIONAL
          );

          const nationalNumber =
            exampleNumber.getNationalNumber()?.toString() || '';
          const formattingOverhead =
            formattedNational.length - nationalNumber.length;

          maxFormattingOverhead = Math.max(
            maxFormattingOverhead,
            formattingOverhead
          );
        }
      } catch (_) {
        // Continue with next type if this one fails
      }
    }

    // If we couldn't analyze any examples, use a reasonable default
    // Most international formatting adds 2-4 characters for spaces and separators
    return maxFormattingOverhead > 0 ? maxFormattingOverhead : 4;
  } catch (_) {
    // Fallback to a standard formatting buffer
    return 4;
  }
};

/**
 * Gets the maximum input length for a given country code.
 * This is used to set the maxlength attribute on the input field.
 * Dynamically adjusts based on whether the current number is valid/formatted.
 *
 * @param options Selected country, current input value and output configuration
 * @returns Maximum allowed length for the input field
 */
export const getMaxInputLength = (options: MaxInputLengthOptions): number => {
  const { countryCode, currentValue, includeDialCode } = options;
  if (!countryCode) {
    return 25; // Default fallback with generous space
  }

  // The selected country's national length cannot bound an empty field (a
  // paste has not happened yet) or an international number entered into the
  // national input: its own country is unknown until it parses. Without
  // this, the browser truncates such a paste before the component sees it.
  if (
    !currentValue ||
    (!includeDialCode && currentValue.trim().startsWith('+'))
  ) {
    return 25;
  }

  try {
    const baseMaxLength = phoneNumberUtils.getMaxPhoneNumberLength(countryCode);

    // Check if the current number is valid and formatted
    const isCurrentNumberValid =
      phoneNumberUtils.isCurrentNumberValidAndFormatted(
        currentValue,
        countryCode,
        { includeDialCode, dialCode: options.dialCode }
      );

    if (isCurrentNumberValid) {
      // For valid numbers, allow full formatting space
      const formattingBuffer =
        phoneNumberUtils.calculateFormattingBuffer(countryCode);
      const safetyMargin = phoneNumberUtils.calculateSafetyMargin({
        includeDialCode,
        outputNumberFormat: options.outputNumberFormat
      });
      return baseMaxLength + formattingBuffer + safetyMargin;
    } else {
      // For invalid numbers, be more restrictive to prevent overly long input
      // Only allow the base number length plus minimal buffer for dial code if included
      let minimalBuffer = includeDialCode ? 4 : 2;

      // Special case: RFC3966 with includeDialCode needs more space even for invalid numbers
      // because "tel:" prefix takes significant space during typing
      if (
        includeDialCode &&
        options.outputNumberFormat === PhoneNumberFormat.RFC3966
      ) {
        minimalBuffer = 8; // Extra space for "tel:" prefix and formatting
      }

      return baseMaxLength + minimalBuffer;
    }
  } catch (_) {
    // If any errors occur, fall back to a conservative default
    const baseMaxLength = phoneNumberUtils.getMaxPhoneNumberLength(countryCode);
    return baseMaxLength + 3; // Minimal fallback buffer
  }
};

/**
 * Object wrapper around the phone number utils so consumers call them as
 * methods, which keeps them spyable in tests (vi.mock is not supported for
 * relative imports under the Angular unit-test builder).
 */
export const phoneNumberUtils = {
  getMaxPhoneNumberLength,
  isValidPhoneNumberLength,
  isCurrentNumberValidAndFormatted,
  calculateSafetyMargin,
  calculateFormattingBuffer,
  getMaxInputLength
};
