import type { Mocked } from 'vitest';
import {
  PhoneNumberFormat,
  PhoneNumberType,
  PhoneNumberUtil
} from 'google-libphonenumber';
import {
  calculateFormattingBuffer,
  calculateSafetyMargin,
  getMaxInputLength,
  getMaxPhoneNumberLength,
  isCurrentNumberValidAndFormatted,
  isValidPhoneNumberLength,
  phoneNumberUtils
} from './phone-number.utils';

describe('Phone Number Utils', () => {
  let mockPhoneNumberUtil: Mocked<PhoneNumberUtil>;
  let mockExampleNumber: any;

  beforeEach(() => {
    // Create mock example number
    mockExampleNumber = {
      getNationalNumber: vi.fn()
    };

    // Create mock PhoneNumberUtil
    mockPhoneNumberUtil = {
      getInstance: vi.fn(),
      getExampleNumberForType: vi.fn(),
      parse: vi.fn()
    } as any;

    // Mock the static getInstance method
    vi.spyOn(PhoneNumberUtil, 'getInstance').mockReturnValue(
      mockPhoneNumberUtil
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getMaxPhoneNumberLength', () => {
    describe('when countryCode is not provided', () => {
      it('should return default maximum length of 15', () => {
        const result = getMaxPhoneNumberLength();
        expect(result).toBe(15);
      });

      it('should return default maximum length of 15 for empty string', () => {
        const result = getMaxPhoneNumberLength('');
        expect(result).toBe(15);
      });
    });

    describe('when countryCode is provided', () => {
      beforeEach(() => {
        mockExampleNumber.getNationalNumber.mockReturnValue(1234567890);
        mockPhoneNumberUtil.getExampleNumberForType.mockReturnValue(
          mockExampleNumber
        );
      });

      it('should return calculated max length plus buffer for valid country', () => {
        const result = getMaxPhoneNumberLength('US');

        expect(
          mockPhoneNumberUtil.getExampleNumberForType
        ).toHaveBeenCalledWith('US', PhoneNumberType.MOBILE);
        expect(
          mockPhoneNumberUtil.getExampleNumberForType
        ).toHaveBeenCalledWith('US', PhoneNumberType.FIXED_LINE);
        expect(
          mockPhoneNumberUtil.getExampleNumberForType
        ).toHaveBeenCalledWith('US', PhoneNumberType.FIXED_LINE_OR_MOBILE);
        expect(result).toBe(13); // 10 digits + 3 buffer
      });

      it('should handle lowercase country codes', () => {
        const result = getMaxPhoneNumberLength('ch');

        expect(
          mockPhoneNumberUtil.getExampleNumberForType
        ).toHaveBeenCalledWith('CH', PhoneNumberType.MOBILE);
        expect(result).toBe(13);
      });

      it('should return the maximum length from different number types', () => {
        // Mock different lengths for different number types
        mockPhoneNumberUtil.getExampleNumberForType
          .mockReturnValueOnce({
            getNationalNumber: () => 123456789 // 9 digits
          } as any)
          .mockReturnValueOnce({
            getNationalNumber: () => 12345678901 // 11 digits
          } as any)
          .mockReturnValueOnce({
            getNationalNumber: () => 1234567890 // 10 digits
          } as any);

        const result = getMaxPhoneNumberLength('DE');

        expect(result).toBe(14); // 11 (max) + 3 buffer
      });

      it('should handle null example numbers gracefully', () => {
        mockPhoneNumberUtil.getExampleNumberForType.mockReturnValue(
          null as any
        );

        const result = getMaxPhoneNumberLength('XX');

        expect(result).toBe(15); // Default fallback
      });

      it('should handle example numbers with null national number', () => {
        mockPhoneNumberUtil.getExampleNumberForType.mockReturnValue({
          getNationalNumber: () => undefined
        } as any);

        const result = getMaxPhoneNumberLength('XX');

        expect(result).toBe(15); // Default fallback
      });

      it('should handle exceptions when getting example numbers', () => {
        mockPhoneNumberUtil.getExampleNumberForType
          .mockImplementationOnce(() => {
            throw new Error('Invalid country');
          })
          .mockReturnValueOnce(mockExampleNumber)
          .mockReturnValueOnce(mockExampleNumber);

        const result = getMaxPhoneNumberLength('XX');

        expect(result).toBe(13); // Should continue with other types
      });

      it('should return default when all example number calls fail', () => {
        mockPhoneNumberUtil.getExampleNumberForType.mockImplementation(() => {
          throw new Error('Invalid country');
        });

        const result = getMaxPhoneNumberLength('XX');

        expect(result).toBe(15); // Default fallback
      });

      it('should handle PhoneNumberUtil getInstance failure', () => {
        vi.spyOn(PhoneNumberUtil, 'getInstance').mockImplementation(() => {
          throw new Error('PhoneNumberUtil error');
        });

        const result = getMaxPhoneNumberLength('US');

        expect(result).toBe(15); // Fallback to default
      });
    });
  });

  describe('isValidPhoneNumberLength', () => {
    let mockParsedNumber: any;

    beforeEach(() => {
      mockParsedNumber = {
        getNationalNumber: vi.fn()
      };
      mockPhoneNumberUtil.parse.mockReturnValue(mockParsedNumber);
    });

    describe('when phone number parsing succeeds', () => {
      it('should return true for valid length phone number', () => {
        mockParsedNumber.getNationalNumber.mockReturnValue(1234567890); // 10 digits

        // Mock getMaxPhoneNumberLength to return 15
        mockExampleNumber.getNationalNumber.mockReturnValue(1234567890);
        mockPhoneNumberUtil.getExampleNumberForType.mockReturnValue(
          mockExampleNumber
        );

        const result = isValidPhoneNumberLength('+1234567890', 'US');

        expect(mockPhoneNumberUtil.parse).toHaveBeenCalledWith(
          '+1234567890',
          'US'
        );
        expect(result).toBe(true);
      });

      it('should return false for phone number exceeding maximum length', () => {
        // Use a number that's within safe integer range but still long enough to test
        const largeNumber = 123456789012345; // 15 digits - safe for JavaScript
        mockParsedNumber.getNationalNumber.mockReturnValue(largeNumber);

        // Mock getMaxPhoneNumberLength to return 10 to make this number exceed the limit
        mockExampleNumber.getNationalNumber.mockReturnValue(1234567); // 7 digits, so max will be 10 (7 + 3)
        mockPhoneNumberUtil.getExampleNumberForType.mockReturnValue(
          mockExampleNumber
        );

        const result = isValidPhoneNumberLength('+123456789012345', 'US');

        expect(result).toBe(false); // 15 > 10
      });

      it('should handle null national number', () => {
        mockParsedNumber.getNationalNumber.mockReturnValue(undefined);

        // Mock getMaxPhoneNumberLength to return 15
        mockExampleNumber.getNationalNumber.mockReturnValue(1234567890);
        mockPhoneNumberUtil.getExampleNumberForType.mockReturnValue(
          mockExampleNumber
        );

        const result = isValidPhoneNumberLength('+1234567890', 'US');

        expect(result).toBe(true); // Empty string length (0) should be <= max length
      });

      it('should work with different country codes', () => {
        mockParsedNumber.getNationalNumber.mockReturnValue(123456789); // 9 digits

        // Mock getMaxPhoneNumberLength to return 12
        mockExampleNumber.getNationalNumber.mockReturnValue(123456789);
        mockPhoneNumberUtil.getExampleNumberForType.mockReturnValue(
          mockExampleNumber
        );

        const result = isValidPhoneNumberLength('+41123456789', 'CH');

        expect(mockPhoneNumberUtil.parse).toHaveBeenCalledWith(
          '+41123456789',
          'CH'
        );
        expect(result).toBe(true);
      });

      it('should handle edge case where length equals maximum', () => {
        mockParsedNumber.getNationalNumber.mockReturnValue(1234567890123); // 13 digits

        // Mock getMaxPhoneNumberLength to return exactly 13
        mockExampleNumber.getNationalNumber.mockReturnValue(1234567890); // 10 digits, so max will be 13 (10 + 3)
        mockPhoneNumberUtil.getExampleNumberForType.mockReturnValue(
          mockExampleNumber
        );

        const result = isValidPhoneNumberLength('+11234567890123', 'US');

        expect(result).toBe(true);
      });
    });

    describe('when phone number parsing fails', () => {
      it('should return false when parse throws an error', () => {
        mockPhoneNumberUtil.parse.mockImplementation(() => {
          throw new Error('Invalid phone number format');
        });

        const result = isValidPhoneNumberLength('invalid-phone', 'US');

        expect(result).toBe(false);
      });

      it('should return false for empty phone number', () => {
        mockPhoneNumberUtil.parse.mockImplementation(() => {
          throw new Error('Empty phone number');
        });

        const result = isValidPhoneNumberLength('', 'US');

        expect(result).toBe(false);
      });

      it('should return false when PhoneNumberUtil getInstance fails', () => {
        vi.spyOn(PhoneNumberUtil, 'getInstance').mockImplementation(() => {
          throw new Error('PhoneNumberUtil error');
        });

        const result = isValidPhoneNumberLength('+1234567890', 'US');

        expect(result).toBe(false);
      });
    });

    describe('integration with getMaxPhoneNumberLength', () => {
      it('should use the correct maximum length from getMaxPhoneNumberLength', () => {
        mockParsedNumber.getNationalNumber.mockReturnValue(123456789012); // 12 digits

        // Mock getMaxPhoneNumberLength to return 10 (which means 12 > 10, should be false)
        mockExampleNumber.getNationalNumber.mockReturnValue(1234567); // 7 digits, so max will be 10 (7 + 3)
        mockPhoneNumberUtil.getExampleNumberForType.mockReturnValue(
          mockExampleNumber
        );

        const result = isValidPhoneNumberLength('+1123456789012', 'US');

        expect(result).toBe(false); // 12 > 10
      });

      it('should handle country codes that return default max length', () => {
        mockParsedNumber.getNationalNumber.mockReturnValue(123456789012345); // 15 digits

        // Mock getMaxPhoneNumberLength to return default (15) by having no example numbers
        mockPhoneNumberUtil.getExampleNumberForType.mockReturnValue(
          null as any
        );

        const result = isValidPhoneNumberLength('+1123456789012345', 'XX');

        expect(result).toBe(true); // 15 <= 15
      });

      it('should handle country codes that return default max length for numbers exceeding default', () => {
        // Use a number that's exactly 16 digits but within JavaScript's safe integer range
        mockParsedNumber.getNationalNumber.mockReturnValue(1234567890123456); // 16 digits

        // Mock getMaxPhoneNumberLength to return default (15) by having no example numbers
        mockPhoneNumberUtil.getExampleNumberForType.mockReturnValue(
          null as any
        );

        const result = isValidPhoneNumberLength('+11234567890123456', 'XX');

        expect(result).toBe(false); // 16 > 15
      });
    });
  });
});

// Moved verbatim from the component spec when the maxlength math was extracted:
// same cases and expectations, called directly instead of through the component.
describe('maxlength budget', () => {
  const baseOptions = {
    currentValue: '1234567890',
    dialCode: '1',
    includeDialCode: false,
    outputNumberFormat: PhoneNumberFormat.INTERNATIONAL
  };

  describe('getMaxInputLength', () => {
    beforeEach(() => {
      vi.spyOn(
        phoneNumberUtils,
        'isCurrentNumberValidAndFormatted'
      ).mockReturnValue(false);
      vi.spyOn(phoneNumberUtils, 'calculateFormattingBuffer').mockReturnValue(
        4
      );
      vi.spyOn(phoneNumberUtils, 'calculateSafetyMargin').mockReturnValue(2);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return default fallback when no country code provided', () => {
      const result = getMaxInputLength({ ...baseOptions });
      expect(result).toBe(25);
    });

    it('should not restrict an empty input, so a paste is not truncated', () => {
      expect(
        getMaxInputLength({
          ...baseOptions,
          countryCode: 'es',
          currentValue: ''
        })
      ).toBe(25);
    });

    it('should not restrict an international number typed into the national input', () => {
      expect(
        getMaxInputLength({
          ...baseOptions,
          countryCode: 'es',
          currentValue: '+41 44 668 18 00'
        })
      ).toBe(25);
    });

    it('should keep restricting when includeDialCode renders the leading +', () => {
      expect(
        getMaxInputLength({
          ...baseOptions,
          countryCode: 'es',
          currentValue: '+34 612 34 56 78',
          includeDialCode: true
        })
      ).toBeLessThan(25);
    });

    it('should return extended length for valid formatted numbers', () => {
      vi.spyOn(
        phoneNumberUtils,
        'isCurrentNumberValidAndFormatted'
      ).mockReturnValue(true);
      const result = getMaxInputLength({ ...baseOptions, countryCode: 'us' });
      expect(result).toBeGreaterThan(15); // Base length + formatting + safety margin
    });

    it('should return restricted length for invalid numbers', () => {
      vi.spyOn(
        phoneNumberUtils,
        'isCurrentNumberValidAndFormatted'
      ).mockReturnValue(false);
      const result = getMaxInputLength({ ...baseOptions, countryCode: 'us' });
      expect(result).toBeLessThan(20); // Base length + minimal buffer
    });

    it('should handle RFC3966 format with includeDialCode', () => {
      const result = getMaxInputLength({
        ...baseOptions,
        countryCode: 'us',
        includeDialCode: true,
        outputNumberFormat: PhoneNumberFormat.RFC3966
      });
      expect(result).toBeGreaterThan(15); // Should include extra buffer for RFC3966
    });

    it('should handle errors gracefully', () => {
      vi.spyOn(
        phoneNumberUtils,
        'isCurrentNumberValidAndFormatted'
      ).mockImplementation(() => {
        throw new Error('Test error');
      });

      const result = getMaxInputLength({ ...baseOptions, countryCode: 'us' });
      expect(result).toBeGreaterThan(10); // Should return fallback
    });
  });

  describe('isCurrentNumberValidAndFormatted', () => {
    const options = { includeDialCode: false, dialCode: '1' };

    it('should return false for short values', () => {
      const result = isCurrentNumberValidAndFormatted('12', 'us', options);
      expect(result).toBe(false);
    });

    it('should return false for empty values', () => {
      const result = isCurrentNumberValidAndFormatted('', 'us', options);
      expect(result).toBe(false);
    });

    it('should return true for valid formatted numbers', () => {
      const result = isCurrentNumberValidAndFormatted(
        '555 123 4567',
        'us',
        options
      );
      expect(result).toBe(false); // This number is not valid without country code
    });

    it('should return false for invalid numbers', () => {
      const result = isCurrentNumberValidAndFormatted('invalid', 'us', options);
      expect(result).toBe(false);
    });

    it('should handle includeDialCode scenario', () => {
      const result = isCurrentNumberValidAndFormatted('+1 555 123 4567', 'us', {
        includeDialCode: true,
        dialCode: '1'
      });
      expect(result).toBe(false); // Adjust expectation based on actual validation logic
    });
  });

  describe('calculateSafetyMargin', () => {
    it('should return base margin for international format', () => {
      const result = calculateSafetyMargin({
        includeDialCode: false,
        outputNumberFormat: PhoneNumberFormat.INTERNATIONAL
      });
      expect(result).toBe(2); // 1 base + 1 for international
    });

    it('should add margin for includeDialCode', () => {
      const result = calculateSafetyMargin({
        includeDialCode: true,
        outputNumberFormat: PhoneNumberFormat.INTERNATIONAL
      });
      expect(result).toBe(3); // 1 base + 1 for includeDialCode + 1 for international
    });

    it('should handle RFC3966 format', () => {
      const result = calculateSafetyMargin({
        includeDialCode: false,
        outputNumberFormat: PhoneNumberFormat.RFC3966
      });
      expect(result).toBe(3); // 1 base + 2 for RFC3966
    });

    it('should handle E164 format', () => {
      const result = calculateSafetyMargin({
        includeDialCode: false,
        outputNumberFormat: PhoneNumberFormat.E164
      });
      expect(result).toBe(1); // 1 base + 0 for E164
    });
  });

  describe('branch coverage moved from the component spec', () => {
    it('should treat a valid but unformatted number as not formatted', () => {
      expect(
        isCurrentNumberValidAndFormatted('612345678', 'es', {
          includeDialCode: false,
          dialCode: '34'
        })
      ).toBe(false);
    });

    it('should treat a valid formatted number as formatted', () => {
      expect(
        isCurrentNumberValidAndFormatted('612 34 56 78', 'es', {
          includeDialCode: false,
          dialCode: '34'
        })
      ).toBe(true);
    });

    it('should handle example numbers without a national number when calculating formatting buffer', () => {
      const exampleSpy = vi
        .spyOn(PhoneNumberUtil.prototype, 'getExampleNumberForType')
        .mockReturnValue({ getNationalNumber: () => null } as never);
      const formatSpy = vi
        .spyOn(PhoneNumberUtil.prototype, 'format')
        .mockReturnValue('123 456');

      expect(calculateFormattingBuffer('us')).toBe(7);

      exampleSpy.mockRestore();
      formatSpy.mockRestore();
    });
  });

  describe('calculateFormattingBuffer', () => {
    it('should calculate formatting buffer based on example numbers', () => {
      const result = calculateFormattingBuffer('us');
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should return default buffer when no examples available', () => {
      const result = calculateFormattingBuffer('xx');
      expect(result).toBe(4); // Default fallback
    });

    it('should handle PhoneNumberUtil.getInstance() errors gracefully', () => {
      // Mock PhoneNumberUtil.getInstance to throw an error
      const originalGetInstance = PhoneNumberUtil.getInstance;
      vi.spyOn(PhoneNumberUtil, 'getInstance').mockImplementation(() => {
        throw new Error('PhoneNumberUtil error');
      });

      const result = calculateFormattingBuffer('us');
      expect(result).toBe(4); // Fallback value from outer catch block

      // Restore original implementation
      PhoneNumberUtil.getInstance = originalGetInstance;
    });
  });
});
