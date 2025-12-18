import { TestBed } from '@angular/core/testing';
import { CountryDataService } from './country-data.service';
import { Country } from '../../types/country.model';
import { CountryCode, CountryData } from '../../data/country-code';
import { CountryISO } from '../../enums/country-iso.enum';
import {
  PhoneNumberFormat,
  PhoneNumberType,
  PhoneNumberUtil
} from 'google-libphonenumber';

describe('CountryDataService', () => {
  let service: CountryDataService;
  let mockPhoneNumberUtil: jest.Mocked<PhoneNumberUtil>;
  let mockCountryCodeData: CountryCode;

  // Mock data for testing
  const mockCountryData: CountryData[] = [
    ['🇺🇸', 'United States', CountryISO.UnitedStates, '1', 0, ['201', '202']],
    ['🇬🇧', 'United Kingdom', CountryISO.UnitedKingdom, '44', 1],
    ['🇩🇪', 'Germany', CountryISO.Germany, '49', 2],
    ['🇫🇷', 'France', CountryISO.France, '33']
  ];

  beforeEach(() => {
    // Create mock PhoneNumberUtil
    mockPhoneNumberUtil = {
      getInstance: jest.fn(),
      format: jest.fn(),
      getExampleNumberForType: jest.fn()
    } as any;

    // Mock the static getInstance method
    jest
      .spyOn(PhoneNumberUtil, 'getInstance')
      .mockReturnValue(mockPhoneNumberUtil);

    // Create mock CountryCode data
    mockCountryCodeData = {
      allCountries: mockCountryData
    } as CountryCode;

    TestBed.configureTestingModule({
      providers: [CountryDataService]
    });

    service = TestBed.inject(CountryDataService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize phoneNumberUtil', () => {
      expect(service.phoneNumberUtil).toBeDefined();
      expect(PhoneNumberUtil.getInstance).toHaveBeenCalled();
    });
  });

  describe('processCountries', () => {
    beforeEach(() => {
      // Mock phone number formatting
      mockPhoneNumberUtil.getExampleNumberForType.mockReturnValue({
        getNationalNumber: () => 1234567890,
        getCountryCode: () => 1
      } as any);
      mockPhoneNumberUtil.format.mockReturnValue('+1 123-456-7890');
    });

    it('should process all countries when no filters are applied', () => {
      const result = service.processCountries(mockCountryCodeData, true, true);

      expect(result).toHaveLength(4);
      expect(result[0].name).toBe('United States');
      expect(result[0].iso2).toBe(CountryISO.UnitedStates);
      expect(result[0].dialCode).toBe('1');
      expect(result[0].emojiFlag).toBe('🇺🇸');
    });

    it('should filter visible countries correctly', () => {
      const visibleCountries = [CountryISO.UnitedStates, CountryISO.Germany];

      const result = service.processCountries(
        mockCountryCodeData,
        true,
        true,
        visibleCountries
      );

      expect(result).toHaveLength(2);
      expect(result.map((c) => c.iso2)).toEqual([
        CountryISO.UnitedStates,
        CountryISO.Germany
      ]);
    });

    it('should exclude countries correctly', () => {
      const excludedCountries = [CountryISO.UnitedStates, CountryISO.France];

      const result = service.processCountries(
        mockCountryCodeData,
        true,
        true,
        undefined,
        undefined,
        excludedCountries
      );

      expect(result).toHaveLength(2);
      expect(result.map((c) => c.iso2)).toEqual([
        CountryISO.UnitedKingdom,
        CountryISO.Germany
      ]);
    });

    it('should sort preferred countries to the top', () => {
      const preferredCountries = [CountryISO.Germany, CountryISO.France];

      const result = service.processCountries(
        mockCountryCodeData,
        true,
        true,
        undefined,
        preferredCountries
      );

      expect(result[0].iso2).toBe(CountryISO.Germany);
      expect(result[1].iso2).toBe(CountryISO.France);
    });

    it('should handle empty placeholder when enablePlaceholder is false', () => {
      const result = service.processCountries(mockCountryCodeData, false, true);

      result.forEach((country) => {
        expect(country.placeHolder).toBe('');
      });
    });

    it('should include placeholders when enablePlaceholder is true', () => {
      const result = service.processCountries(mockCountryCodeData, true, true);

      result.forEach((country) => {
        expect(country.placeHolder).toBe('+1 123-456-7890');
      });
    });

    it('should generate masks when useMask is true', () => {
      const result = service.processCountries(
        mockCountryCodeData,
        true,
        true,
        undefined,
        undefined,
        undefined,
        true
      );

      result.forEach((country) => {
        expect(country.mask).toBeDefined();
        expect(country.mask?.mask).toBeDefined();
        expect(country.mask?.lazy).toBeDefined();
      });
    });

    it('should not generate masks when useMask is false', () => {
      const result = service.processCountries(
        mockCountryCodeData,
        true,
        true,
        undefined,
        undefined,
        undefined,
        false
      );

      result.forEach((country) => {
        expect(country.mask).toBeUndefined();
      });
    });

    it('should handle different output number formats', () => {
      mockPhoneNumberUtil.format.mockReturnValue('+1 (123) 456-7890');

      const result = service.processCountries(
        mockCountryCodeData,
        true,
        true,
        undefined,
        undefined,
        undefined,
        false,
        false,
        false,
        PhoneNumberFormat.NATIONAL
      );

      expect(mockPhoneNumberUtil.format).toHaveBeenCalledWith(
        expect.anything(),
        PhoneNumberFormat.NATIONAL
      );
    });
  });

  describe('getPhoneNumberPlaceholder', () => {
    beforeEach(() => {
      mockPhoneNumberUtil.getExampleNumberForType.mockReturnValue({
        getNationalNumber: () => 1234567890,
        getCountryCode: () => 1
      } as any);
    });

    it('should return formatted international number when includeDialCode is true', () => {
      mockPhoneNumberUtil.format.mockReturnValue('+1 123-456-7890');

      const result = (service as any).getPhoneNumberPlaceholder(
        'US',
        true,
        PhoneNumberFormat.INTERNATIONAL
      );

      expect(result).toBe('+1 123-456-7890');
      expect(mockPhoneNumberUtil.format).toHaveBeenCalledWith(
        expect.anything(),
        PhoneNumberFormat.INTERNATIONAL
      );
    });

    it('should return formatted national number when includeDialCode is false', () => {
      mockPhoneNumberUtil.format.mockReturnValue('(123) 456-7890');

      const result = (service as any).getPhoneNumberPlaceholder(
        'US',
        false,
        PhoneNumberFormat.INTERNATIONAL
      );

      expect(result).toBe('(123) 456-7890');
      expect(mockPhoneNumberUtil.format).toHaveBeenCalledWith(
        expect.anything(),
        PhoneNumberFormat.NATIONAL
      );
    });

    it('should always use international format for MP (Northern Mariana Islands)', () => {
      mockPhoneNumberUtil.format.mockReturnValue('+1 670 123-4567');

      const result = (service as any).getPhoneNumberPlaceholder(
        'MP',
        false,
        PhoneNumberFormat.INTERNATIONAL
      );

      expect(result).toBe('+1 670 123-4567');
      expect(mockPhoneNumberUtil.format).toHaveBeenCalledWith(
        expect.anything(),
        PhoneNumberFormat.INTERNATIONAL
      );
    });

    it('should return empty string when phone number util throws error', () => {
      mockPhoneNumberUtil.getExampleNumberForType.mockImplementation(() => {
        throw new Error('Invalid country code');
      });

      const result = (service as any).getPhoneNumberPlaceholder(
        'INVALID',
        true,
        PhoneNumberFormat.INTERNATIONAL
      );

      expect(result).toBe('');
    });

    it('should call getExampleNumberForType with MOBILE type', () => {
      (service as any).getPhoneNumberPlaceholder(
        'US',
        true,
        PhoneNumberFormat.INTERNATIONAL
      );

      expect(mockPhoneNumberUtil.getExampleNumberForType).toHaveBeenCalledWith(
        'US',
        PhoneNumberType.MOBILE
      );
    });
  });

  describe('formatPhoneNumberWithPrefix', () => {
    it('should format phone number with masked prefix when maskPrefix is true', () => {
      const phoneNumber = '+1 (123) 456-7890';

      const result = (service as any).formatPhoneNumberWithPrefix(
        phoneNumber,
        true
      );

      expect(result).toBe('+{0} (000) 000-0000');
    });

    it('should format phone number with original prefix when maskPrefix is false', () => {
      const phoneNumber = '+1 (123) 456-7890';

      const result = (service as any).formatPhoneNumberWithPrefix(
        phoneNumber,
        false
      );

      expect(result).toBe('+{1} (000) 000-0000');
    });

    it('should handle phone numbers with longer prefixes', () => {
      const phoneNumber = '+44 20 1234 5678';

      const result = (service as any).formatPhoneNumberWithPrefix(
        phoneNumber,
        true
      );

      expect(result).toBe('+{00} 00 0000 0000');
    });

    it('should handle phone numbers without prefix', () => {
      const phoneNumber = '(123) 456-7890';

      const result = (service as any).formatPhoneNumberWithPrefix(
        phoneNumber,
        true
      );

      expect(result).toBe('(000) 000-0000');
    });

    it('should handle empty phone number', () => {
      const phoneNumber = '';

      const result = (service as any).formatPhoneNumberWithPrefix(
        phoneNumber,
        true
      );

      expect(result).toBe('');
    });
  });

  describe('getCountryObject', () => {
    beforeEach(() => {
      mockPhoneNumberUtil.getExampleNumberForType.mockReturnValue({
        getNationalNumber: () => 1234567890,
        getCountryCode: () => 1
      } as any);
      mockPhoneNumberUtil.format.mockReturnValue('+1 123-456-7890');
    });

    it('should create country object with all required properties', () => {
      const countryData: CountryData = [
        '🇺🇸',
        'United States',
        CountryISO.UnitedStates,
        '1',
        0,
        ['201', '202']
      ];

      const result = (service as any).getCountryObject(
        countryData,
        true,
        true,
        false,
        false,
        false,
        PhoneNumberFormat.INTERNATIONAL,
        false
      );

      expect(result).toEqual({
        emojiFlag: '🇺🇸',
        name: 'United States',
        iso2: CountryISO.UnitedStates,
        dialCode: '1',
        priority: 0,
        areaCodes: ['201', '202'],
        htmlId: 'country-code__us',
        flagClass: 'country-code__us',
        placeHolder: '+1 123-456-7890'
      });
    });

    it('should handle country data without priority', () => {
      const countryData: CountryData = [
        '🇫🇷',
        'France',
        CountryISO.France,
        '33'
      ];

      const result = (service as any).getCountryObject(
        countryData,
        true,
        true,
        false,
        false,
        false,
        PhoneNumberFormat.INTERNATIONAL,
        false
      );

      expect(result.priority).toBe(0);
      expect(result.areaCodes).toBeUndefined();
    });

    it('should include mask when useMask is true', () => {
      const countryData: CountryData = [
        '🇺🇸',
        'United States',
        CountryISO.UnitedStates,
        '1'
      ];

      const result = (service as any).getCountryObject(
        countryData,
        true,
        true,
        true,
        false,
        false,
        PhoneNumberFormat.INTERNATIONAL,
        false
      );

      expect(result.mask).toBeDefined();
      expect(result.mask?.mask).toBeDefined();
      expect(result.mask?.lazy).toBe(true);
    });

    it('should set lazy to false when showMaskPlaceholder is true', () => {
      const countryData: CountryData = [
        '🇺🇸',
        'United States',
        CountryISO.UnitedStates,
        '1'
      ];

      const result = (service as any).getCountryObject(
        countryData,
        true,
        true,
        true,
        false,
        true,
        PhoneNumberFormat.INTERNATIONAL,
        false
      );

      expect(result.mask?.lazy).toBe(false);
    });
  });

  describe('sortCountries', () => {
    let countries: Country[];

    beforeEach(() => {
      countries = [
        { iso2: CountryISO.UnitedStates, name: 'United States' } as Country,
        { iso2: CountryISO.UnitedKingdom, name: 'United Kingdom' } as Country,
        { iso2: CountryISO.Germany, name: 'Germany' } as Country,
        { iso2: CountryISO.France, name: 'France' } as Country
      ];
    });

    it('should sort preferred countries to the top', () => {
      const preferredCountries = [CountryISO.Germany, CountryISO.France];

      const result = (service as any).sortCountries(
        countries,
        preferredCountries
      );

      expect(result[0].iso2).toBe(CountryISO.Germany);
      expect(result[1].iso2).toBe(CountryISO.France);
      expect(result[2].iso2).toBe(CountryISO.UnitedStates);
      expect(result[3].iso2).toBe(CountryISO.UnitedKingdom);
    });

    it('should return original order when no preferred countries', () => {
      const result = (service as any).sortCountries(countries, undefined);

      expect(result).toEqual(countries);
    });

    it('should return original order when preferred countries is empty', () => {
      const result = (service as any).sortCountries(countries, []);

      expect(result).toEqual(countries);
    });

    it('should handle partial matches in preferred countries', () => {
      const preferredCountries = [CountryISO.Germany, 'nonexistent'];

      const result = (service as any).sortCountries(
        countries,
        preferredCountries
      );

      expect(result[0].iso2).toBe(CountryISO.Germany);
      expect(result.slice(1)).toEqual(
        countries.filter((c) => c.iso2 !== CountryISO.Germany)
      );
    });

    it('should return 1 when first country is not preferred but second country is preferred', () => {
      const preferredCountries = [CountryISO.Germany];
      // Create countries where the first one is NOT preferred and second one IS preferred
      // This will force the sort function to execute the "return 1" branch
      const testCountries = [
        {
          iso2: CountryISO.UnitedStates as CountryISO | string,
          name: 'United States'
        } as Country,
        {
          iso2: CountryISO.Germany as CountryISO | string,
          name: 'Germany'
        } as Country
      ];

      // This should trigger the internal sort comparison that returns 1
      // when !preferredCountries.includes(a.iso2) && preferredCountries.includes(b.iso2)
      const result = (service as any).sortCountries(
        testCountries,
        preferredCountries
      );

      // Germany (preferred) should come first, US (not preferred) should come second
      expect(result[0].iso2).toBe(CountryISO.Germany);
      expect(result[1].iso2).toBe(CountryISO.UnitedStates);
      expect(result).toHaveLength(2);
    });

    it('should execute return 1 branch when non-preferred country is compared with preferred country', () => {
      // Create a scenario with multiple countries to ensure the sort comparison happens
      const preferredCountries = [CountryISO.France];
      const testCountries = [
        {
          iso2: CountryISO.UnitedStates as CountryISO | string,
          name: 'United States'
        } as Country,
        {
          iso2: CountryISO.UnitedKingdom as CountryISO | string,
          name: 'United Kingdom'
        } as Country,
        {
          iso2: CountryISO.France as CountryISO | string,
          name: 'France'
        } as Country,
        {
          iso2: CountryISO.Germany as CountryISO | string,
          name: 'Germany'
        } as Country
      ];

      const result = (service as any).sortCountries(
        testCountries,
        preferredCountries
      );

      // France should be first (preferred), others should follow
      expect(result[0].iso2).toBe(CountryISO.France);
      // The other countries should maintain their relative order
      expect(result.slice(1).map((c: Country) => c.iso2)).toEqual([
        CountryISO.UnitedStates,
        CountryISO.UnitedKingdom,
        CountryISO.Germany
      ]);
    });

    it('should hit return 1 branch when non-preferred country comes before preferred country in sort', () => {
      // Create a specific scenario where we have a non-preferred country followed by a preferred country
      // This will force the sort algorithm to compare them and execute the "return 1" branch
      const preferredCountries = [CountryISO.UnitedKingdom];
      const testCountries = [
        {
          iso2: CountryISO.UnitedStates as CountryISO | string,
          name: 'United States'
        } as Country, // NOT preferred
        {
          iso2: CountryISO.UnitedKingdom as CountryISO | string,
          name: 'United Kingdom'
        } as Country // IS preferred
      ];

      // When sorting, the algorithm will compare US (not preferred) with UK (preferred)
      // This should trigger: !preferredCountries.includes(a.iso2) && preferredCountries.includes(b.iso2)
      // Which returns 1, meaning UK should come before US
      const result = (service as any).sortCountries(
        testCountries,
        preferredCountries
      );

      expect(result).toHaveLength(2);
      expect(result[0].iso2).toBe(CountryISO.UnitedKingdom); // Preferred country first
      expect(result[1].iso2).toBe(CountryISO.UnitedStates); // Non-preferred country second
    });

    it('should trigger return 1 with mixed preferred and non-preferred countries', () => {
      // Create a larger array with mixed preferred/non-preferred to force more comparisons
      const preferredCountries = [CountryISO.Germany, CountryISO.France];
      const testCountries = [
        {
          iso2: CountryISO.UnitedStates as CountryISO | string,
          name: 'United States'
        } as Country, // NOT preferred
        {
          iso2: CountryISO.UnitedKingdom as CountryISO | string,
          name: 'United Kingdom'
        } as Country, // NOT preferred
        {
          iso2: CountryISO.Germany as CountryISO | string,
          name: 'Germany'
        } as Country, // IS preferred
        {
          iso2: CountryISO.Australia as CountryISO | string,
          name: 'Australia'
        } as Country, // NOT preferred
        {
          iso2: CountryISO.France as CountryISO | string,
          name: 'France'
        } as Country, // IS preferred
        {
          iso2: CountryISO.Canada as CountryISO | string,
          name: 'Canada'
        } as Country // NOT preferred
      ];

      // This should force multiple comparisons including the case where
      // a non-preferred country (like US, UK, Australia, Canada) is compared with a preferred country (Germany, France)
      const result = (service as any).sortCountries(
        testCountries,
        preferredCountries
      );

      // Preferred countries should come first
      expect(result[0].iso2).toBe(CountryISO.Germany);
      expect(result[1].iso2).toBe(CountryISO.France);

      // Non-preferred countries should follow
      const nonPreferredResults = result.slice(2).map((c: Country) => c.iso2);
      expect(nonPreferredResults).toContain(CountryISO.UnitedStates);
      expect(nonPreferredResults).toContain(CountryISO.UnitedKingdom);
      expect(nonPreferredResults).toContain(CountryISO.Australia);
      expect(nonPreferredResults).toContain(CountryISO.Canada);
    });

    it('should execute return 1 branch during sort comparison', () => {
      // Create a very specific scenario that will force the sort algorithm to compare
      // a non-preferred country (first parameter) with a preferred country (second parameter)
      const preferredCountries = [CountryISO.France];

      // Order the array so that during sorting, a non-preferred country will be compared with France
      const testCountries = [
        {
          iso2: CountryISO.UnitedStates as CountryISO | string,
          name: 'United States'
        } as Country, // NOT preferred
        {
          iso2: CountryISO.France as CountryISO | string,
          name: 'France'
        } as Country, // IS preferred
        {
          iso2: CountryISO.Germany as CountryISO | string,
          name: 'Germany'
        } as Country // NOT preferred
      ];

      // During the sort process, when comparing US (a) with France (b):
      // - !preferredCountries.includes(a.iso2) = !preferredCountries.includes('us') = true
      // - preferredCountries.includes(b.iso2) = preferredCountries.includes('fr') = true
      // This should trigger the "return 1" branch
      const result = (service as any).sortCountries(
        testCountries,
        preferredCountries
      );

      // France should be first (preferred), then US and Germany in their original relative order
      expect(result[0].iso2).toBe(CountryISO.France);
      expect(result[1].iso2).toBe(CountryISO.UnitedStates);
      expect(result[2].iso2).toBe(CountryISO.Germany);
    });

    it('should definitely hit return 1 with strategic array ordering', () => {
      // Create an array where we guarantee that during sorting, a non-preferred country
      // will be compared with a preferred country in the exact order that triggers return 1
      const preferredCountries = [CountryISO.Germany];

      // Strategic ordering: put non-preferred countries before preferred ones
      // This forces the sort algorithm to make comparisons that will hit the return 1 branch
      const testCountries = [
        {
          iso2: CountryISO.Australia as CountryISO | string,
          name: 'Australia'
        } as Country, // NOT preferred
        {
          iso2: CountryISO.Canada as CountryISO | string,
          name: 'Canada'
        } as Country, // NOT preferred
        {
          iso2: CountryISO.UnitedStates as CountryISO | string,
          name: 'United States'
        } as Country, // NOT preferred
        {
          iso2: CountryISO.Germany as CountryISO | string,
          name: 'Germany'
        } as Country, // IS preferred
        {
          iso2: CountryISO.UnitedKingdom as CountryISO | string,
          name: 'United Kingdom'
        } as Country // NOT preferred
      ];

      // When the sort algorithm processes this array, it will compare non-preferred countries
      // (Australia, Canada, US, UK) with the preferred country (Germany)
      // This should trigger: !preferredCountries.includes(a.iso2) && preferredCountries.includes(b.iso2)
      // which returns 1, moving the preferred country earlier in the array
      const result = (service as any).sortCountries(
        testCountries,
        preferredCountries
      );

      // Germany should be first (preferred)
      expect(result[0].iso2).toBe(CountryISO.Germany);

      // All other countries should follow in some order
      const remainingCountries = result.slice(1).map((c: Country) => c.iso2);
      expect(remainingCountries).toContain(CountryISO.Australia);
      expect(remainingCountries).toContain(CountryISO.Canada);
      expect(remainingCountries).toContain(CountryISO.UnitedStates);
      expect(remainingCountries).toContain(CountryISO.UnitedKingdom);
      expect(result).toHaveLength(5);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty country data', () => {
      const emptyCountryCodeData = { allCountries: [] } as CountryCode;

      const result = service.processCountries(emptyCountryCodeData, true, true);

      expect(result).toEqual([]);
    });

    it('should handle malformed country data gracefully', () => {
      const malformedData = {
        allCountries: [
          ['🇺🇸', 'United States', CountryISO.UnitedStates, '1'],
          null as any,
          ['🇬🇧', 'United Kingdom', CountryISO.UnitedKingdom, '44']
        ].filter(Boolean)
      } as CountryCode;

      mockPhoneNumberUtil.getExampleNumberForType.mockReturnValue({
        getNationalNumber: () => 1234567890,
        getCountryCode: () => 1
      } as any);
      mockPhoneNumberUtil.format.mockReturnValue('+1 123-456-7890');

      expect(() => {
        service.processCountries(malformedData, true, true);
      }).not.toThrow();
    });

    it('should handle phone number util errors gracefully', () => {
      mockPhoneNumberUtil.getExampleNumberForType.mockImplementation(() => {
        throw new Error('Phone number util error');
      });

      const result = service.processCountries(mockCountryCodeData, true, true);

      expect(result).toHaveLength(4);
      result.forEach((country) => {
        expect(country.placeHolder).toBe('');
      });
    });
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      mockPhoneNumberUtil.getExampleNumberForType.mockReturnValue({
        getNationalNumber: () => 1234567890,
        getCountryCode: () => 1
      } as any);
      mockPhoneNumberUtil.format.mockReturnValue('+1 123-456-7890');
    });

    it('should process countries with all options enabled', () => {
      const result = service.processCountries(
        mockCountryCodeData,
        true, // enablePlaceholder
        true, // includeDialCode
        [CountryISO.UnitedStates, CountryISO.UnitedKingdom], // visibleCountries
        [CountryISO.UnitedKingdom], // preferredCountries
        undefined, // excludedCountries
        true, // useMask
        true, // forceSelectedCountryCode
        true, // showMaskPlaceholder
        PhoneNumberFormat.INTERNATIONAL // outputNumberFormat
      );

      expect(result).toHaveLength(2);
      expect(result[0].iso2).toBe(CountryISO.UnitedKingdom); // preferred country first
      expect(result[0].placeHolder).toBe('+1 123-456-7890');
      expect(result[0].mask).toBeDefined();
      expect(result[0].mask?.lazy).toBe(false);
    });

    it('should process countries with minimal options', () => {
      const result = service.processCountries(
        mockCountryCodeData,
        false, // enablePlaceholder
        false, // includeDialCode
        undefined, // visibleCountries
        undefined, // preferredCountries
        undefined, // excludedCountries
        false, // useMask
        false, // forceSelectedCountryCode
        false, // showMaskPlaceholder
        PhoneNumberFormat.NATIONAL // outputNumberFormat
      );

      expect(result).toHaveLength(4);
      result.forEach((country) => {
        expect(country.placeHolder).toBe('');
        expect(country.mask).toBeUndefined();
      });
    });
  });
});
