import { TestBed } from '@angular/core/testing';
import { CountryDataService } from './country-data.service';
import { Country } from '../../types/country.model';
import { CountryCode, CountryData } from '../../data/country-code';
import { CountryISO } from '../../enums/country-iso.enum';
import { PhoneNumberFormat } from '../../enums/phone-number-format.enum';

describe('CountryDataService', () => {
  let service: CountryDataService;
  let mockCountryCodeData: CountryCode;

  const mockCountryData: CountryData[] = [
    ['🇺🇸', 'United States', CountryISO.UnitedStates, '1', 0, ['201', '202']],
    ['🇬🇧', 'United Kingdom', CountryISO.UnitedKingdom, '44', 1],
    ['🇩🇪', 'Germany', CountryISO.Germany, '49', 2],
    ['🇫🇷', 'France', CountryISO.France, '33']
  ];

  beforeEach(() => {
    mockCountryCodeData = {
      allCountries: mockCountryData
    } as CountryCode;

    TestBed.configureTestingModule({
      providers: [CountryDataService]
    });
    service = TestBed.inject(CountryDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('processCountries', () => {
    it('should process all countries when no filters are applied', () => {
      const result = service.processCountries(mockCountryCodeData, {
        enablePlaceholder: true
      });

      expect(result).toHaveLength(4);
      expect(result[0]).toMatchObject({
        name: 'United States',
        iso2: CountryISO.UnitedStates,
        dialCode: '1',
        emojiFlag: '🇺🇸',
        priority: 0,
        areaCodes: ['201', '202'],
        htmlId: 'country-code__us',
        flagClass: 'country-code__us'
      });
    });

    it('should default to no options at all', () => {
      const result = service.processCountries(mockCountryCodeData);

      expect(result).toHaveLength(4);
      expect(result[0].placeHolder).toBe('');
      expect(result[0].mask).toBeUndefined();
    });

    it('should filter visible countries correctly', () => {
      const result = service.processCountries(mockCountryCodeData, {
        visibleCountries: [CountryISO.UnitedStates, CountryISO.Germany]
      });

      expect(result.map((c) => c.iso2)).toEqual([
        CountryISO.UnitedStates,
        CountryISO.Germany
      ]);
    });

    it('should exclude countries correctly', () => {
      const result = service.processCountries(mockCountryCodeData, {
        excludedCountries: [CountryISO.UnitedStates, CountryISO.France]
      });

      expect(result.map((c) => c.iso2)).toEqual([
        CountryISO.UnitedKingdom,
        CountryISO.Germany
      ]);
    });

    it('should sort preferred countries to the top, preserving their order', () => {
      const result = service.processCountries(mockCountryCodeData, {
        preferredCountries: [CountryISO.Germany, CountryISO.UnitedKingdom]
      });

      expect(result.map((c) => c.iso2).slice(0, 2)).toEqual([
        CountryISO.Germany,
        CountryISO.UnitedKingdom
      ]);
    });

    it('should return original order when preferred countries is empty', () => {
      const result = service.processCountries(mockCountryCodeData, {
        preferredCountries: []
      });

      expect(result.map((c) => c.iso2)).toEqual(['us', 'gb', 'de', 'fr']);
    });

    it('should include real placeholders when enablePlaceholder is true', () => {
      const result = service.processCountries(mockCountryCodeData, {
        enablePlaceholder: true
      });

      expect(result[0].placeHolder).toBe('(201) 555-0123');
    });

    it('should leave placeholders empty when enablePlaceholder is false', () => {
      const result = service.processCountries(mockCountryCodeData, {
        enablePlaceholder: false
      });

      expect(result.every((c) => c.placeHolder === '')).toBe(true);
    });

    it('should generate masks when useMask is true', () => {
      const result = service.processCountries(mockCountryCodeData, {
        enablePlaceholder: true,
        useMask: true
      });

      expect(result[0].mask).toBeDefined();
      expect(result[0].mask?.lazy).toBe(true);
    });

    it('should generate eager masks when showMaskPlaceholder is true', () => {
      const result = service.processCountries(mockCountryCodeData, {
        enablePlaceholder: true,
        useMask: true,
        showMaskPlaceholder: true
      });

      expect(result[0].mask?.lazy).toBe(false);
    });

    it('should not generate masks when useMask is false', () => {
      const result = service.processCountries(mockCountryCodeData, {
        enablePlaceholder: true
      });

      expect(result.every((c) => c.mask === undefined)).toBe(true);
    });

    it('should format placeholders in the requested output format when includeDialCode is true', () => {
      const result = service.processCountries(mockCountryCodeData, {
        enablePlaceholder: true,
        includeDialCode: true,
        outputNumberFormat: PhoneNumberFormat.E164
      });

      expect(result[0].placeHolder).toBe('+12015550123');
    });

    it('should handle empty country data', () => {
      const result = service.processCountries({
        allCountries: []
      } as unknown as CountryCode);

      expect(result).toEqual([]);
    });
  });

  describe('getPhoneNumberPlaceholder', () => {
    const getPlaceholder = (
      countryCode: string,
      includeDialCode: boolean,
      format: PhoneNumberFormat = PhoneNumberFormat.INTERNATIONAL
    ): string =>
      (
        service as unknown as {
          getPhoneNumberPlaceholder: (
            c: string,
            i: boolean,
            f: PhoneNumberFormat
          ) => string;
        }
      ).getPhoneNumberPlaceholder(countryCode, includeDialCode, format);

    it('should return international format when includeDialCode is true', () => {
      expect(getPlaceholder('US', true)).toBe('+1 201 555 0123');
    });

    it('should return national format when includeDialCode is false', () => {
      expect(getPlaceholder('US', false)).toBe('(201) 555-0123');
    });

    it('should always use the output format for MP (Northern Mariana Islands)', () => {
      expect(getPlaceholder('MP', false)).toBe('+1 670 234 5678');
    });

    it('should return empty string for unknown countries', () => {
      expect(getPlaceholder('XX', false)).toBe('');
    });
  });

  describe('formatPhoneNumberWithPrefix', () => {
    const format = (phoneNumber: string, maskPrefix: boolean): string =>
      (
        service as unknown as {
          formatPhoneNumberWithPrefix: (p: string, m: boolean) => string;
        }
      ).formatPhoneNumberWithPrefix(phoneNumber, maskPrefix);

    it('should mask the prefix when maskPrefix is true', () => {
      expect(format('+41 78 123 45 67', true)).toBe('+{00} 00 000 00 00');
    });

    it('should keep the original prefix when maskPrefix is false', () => {
      expect(format('+41 78 123 45 67', false)).toBe('+{41} 00 000 00 00');
    });

    it('should handle phone numbers without prefix', () => {
      expect(format('078 123 45 67', true)).toBe('000 000 00 00');
    });

    it('should handle empty phone number', () => {
      expect(format('', true)).toBe('');
    });
  });

  describe('localized country names', () => {
    it('should keep the fallback name when localization is disabled', () => {
      const result = service.processCountries(mockCountryCodeData, {
        localizeCountryNames: false
      });

      expect(result.map((c: Country) => c.name)).toContain('United States');
    });
  });
});
