import { PhoneNumberType, PhoneNumberUtil } from 'google-libphonenumber';
import {
  getMaxPhoneNumberLength,
  isValidPhoneNumberLength
} from './phone-number.utils';

describe('Phone Number Utils', () => {
  let mockPhoneNumberUtil: jest.Mocked<PhoneNumberUtil>;
  let mockExampleNumber: any;

  beforeEach(() => {
    // Create mock example number
    mockExampleNumber = {
      getNationalNumber: jest.fn()
    };

    // Create mock PhoneNumberUtil
    mockPhoneNumberUtil = {
      getInstance: jest.fn(),
      getExampleNumberForType: jest.fn(),
      parse: jest.fn()
    } as any;

    // Mock the static getInstance method
    jest
      .spyOn(PhoneNumberUtil, 'getInstance')
      .mockReturnValue(mockPhoneNumberUtil);
  });

  afterEach(() => {
    jest.clearAllMocks();
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
        jest.spyOn(PhoneNumberUtil, 'getInstance').mockImplementation(() => {
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
        getNationalNumber: jest.fn()
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
        jest.spyOn(PhoneNumberUtil, 'getInstance').mockImplementation(() => {
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
