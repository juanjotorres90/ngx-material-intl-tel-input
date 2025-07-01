import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { PhoneInputFacadeService } from './phone-input-facade.service';
import { CountryDataService } from '../country-data/country-data.service';
import { GeoIpService } from '../geo-ip/geo-ip.service';
import { CountryCode } from '../../data/country-code';

describe('PhoneInputFacadeService', () => {
  let service: PhoneInputFacadeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PhoneInputFacadeService,
        CountryDataService,
        GeoIpService,
        CountryCode
      ]
    });
    service = TestBed.inject(PhoneInputFacadeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default signal values', () => {
    expect(service.selectedCountry()).toBeNull();
    expect(service.phoneNumber()).toBe('');
    expect(service.isLoading()).toBe(true); // Loading starts as true before initialization
    expect(service.isFocused()).toBe(false);
    expect(service.filteredCountries()).toEqual([]);
    expect(service.maxInputLength()).toBe(15);
  });

  it('should update focus state', () => {
    service.setFocusState(true);
    expect(service.isFocused()).toBe(true);

    service.setFocusState(false);
    expect(service.isFocused()).toBe(false);
  });

  it('should set phone number', () => {
    const phoneNumber = '+1234567890';
    service.setPhoneNumber(phoneNumber);
    expect(service.phoneNumber()).toBe(phoneNumber);
  });

  it('should set selected country', () => {
    const mockCountry = {
      iso2: 'us',
      dialCode: '1',
      name: 'United States',
      flagClass: 'flag-us',
      emojiFlag: '🇺🇸',
      mask: { mask: '+1 (###) ###-####' },
      placeHolder: '+1 (555) 123-4567',
      priority: 0,
      areaCodes: undefined,
      htmlId: 'country-us'
    };

    service.setSelectedCountry(mockCountry);
    expect(service.selectedCountry()).toEqual(mockCountry);
  });

  it('should reset all values', () => {
    const mockCountry = {
      iso2: 'us',
      dialCode: '1',
      name: 'United States',
      flagClass: 'flag-us',
      emojiFlag: '🇺🇸',
      mask: { mask: '+1 (###) ###-####' },
      placeHolder: '+1 (555) 123-4567',
      priority: 0,
      areaCodes: undefined,
      htmlId: 'country-us'
    };

    service.setSelectedCountry(mockCountry);
    service.setPhoneNumber('1234567890');
    service.setFocusState(true);

    // Reset by setting default values
    service.setSelectedCountry({
      iso2: '',
      dialCode: '',
      name: '',
      flagClass: '',
      emojiFlag: '',
      mask: { mask: '' },
      placeHolder: '',
      priority: 0,
      areaCodes: undefined,
      htmlId: ''
    });
    service.setPhoneNumber('');
    service.setFocusState(false);

    // Check if values are properly reset
    expect(service.phoneNumber()).toBe('');
    expect(service.isFocused()).toBe(false);
  });

  describe('Error Handling and Edge Cases', () => {
    let countryDataService: CountryDataService;
    let geoIpService: GeoIpService;

    beforeEach(() => {
      countryDataService = TestBed.inject(CountryDataService);
      geoIpService = TestBed.inject(GeoIpService);
    });

    it('should handle initialization errors gracefully', async () => {
      // Mock console.error to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock processCountries to throw an error
      jest
        .spyOn(countryDataService, 'processCountries')
        .mockImplementation(() => {
          throw new Error('Failed to process countries');
        });

      const config = { autoSelectCountry: true };
      await service.initialize(config);

      expect(service.isLoading()).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to initialize phone input:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle auto-select country errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock autoSelectCountry to throw an error
      jest.spyOn(service as any, 'autoSelectCountry').mockImplementation(() => {
        throw new Error('Failed to auto select country');
      });

      const config = { autoSelectCountry: true };
      await service.initialize(config);

      expect(service.isLoading()).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should validate phone number correctly when valid', () => {
      // Set up a valid phone number and country
      const mockCountry = {
        iso2: 'us',
        dialCode: '1',
        name: 'United States',
        flagClass: 'flag-us',
        emojiFlag: '🇺🇸',
        mask: undefined,
        placeHolder: '+1 (555) 123-4567',
        priority: 0,
        areaCodes: undefined,
        htmlId: 'country-us'
      };

      service.setSelectedCountry(mockCountry);
      service.setPhoneNumber('+12015550123');

      expect(service.isPhoneNumberValid()).toBe(true);
    });

    it('should invalidate phone number when country is missing', () => {
      service.setPhoneNumber('+1 201 555 0123');
      // No country selected

      expect(service.isPhoneNumberValid()).toBe(false);
    });

    it('should invalidate phone number when phone number is missing', () => {
      const mockCountry = {
        iso2: 'us',
        dialCode: '1',
        name: 'United States',
        flagClass: 'flag-us',
        emojiFlag: '🇺🇸',
        mask: undefined,
        placeHolder: '+1 (555) 123-4567',
        priority: 0,
        areaCodes: undefined,
        htmlId: 'country-us'
      };

      service.setSelectedCountry(mockCountry);
      // No phone number set

      expect(service.isPhoneNumberValid()).toBe(false);
    });

    it('should handle phone number parsing errors in validation', () => {
      const mockCountry = {
        iso2: 'us',
        dialCode: '1',
        name: 'United States',
        flagClass: 'flag-us',
        emojiFlag: '🇺🇸',
        mask: undefined,
        placeHolder: '+1 (555) 123-4567',
        priority: 0,
        areaCodes: undefined,
        htmlId: 'country-us'
      };

      service.setSelectedCountry(mockCountry);
      service.setPhoneNumber('invalid-phone-number');

      expect(service.isPhoneNumberValid()).toBe(false);
    });

    it('should handle initialization with null/undefined config', async () => {
      await service.initialize(undefined);

      expect(service.isLoading()).toBe(false);
    });

    it('should handle empty phone number gracefully', () => {
      service.setPhoneNumber('');

      expect(service.phoneNumber()).toBe('');
      expect(service.isPhoneNumberValid()).toBe(false);
    });

    it('should handle null country selection', () => {
      service.setSelectedCountry(null as any);

      expect(service.selectedCountry()).toBeNull();
    });

    it('should handle filter with empty search term', () => {
      const mockCountries = [
        { name: 'United States', iso2: 'us', dialCode: '1' },
        { name: 'United Kingdom', iso2: 'gb', dialCode: '44' }
      ];

      service['_allCountries'].set(mockCountries as any);
      service.filterCountries('');

      // Should return all countries when search term is empty
      expect(service.filteredCountries()).toEqual(mockCountries);
    });

    it('should handle filter with non-matching search term', () => {
      const mockCountries = [
        { name: 'United States', iso2: 'us', dialCode: '1' },
        { name: 'United Kingdom', iso2: 'gb', dialCode: '44' }
      ];

      service['_allCountries'].set(mockCountries as any);
      service.filterCountries('xyz');

      // Should return empty array when no matches found
      expect(service.filteredCountries()).toEqual([]);
    });

    it('should handle case-insensitive filtering', () => {
      const mockCountries = [
        { name: 'United States', iso2: 'us', dialCode: '1' },
        { name: 'United Kingdom', iso2: 'gb', dialCode: '44' }
      ];

      service['_allCountries'].set(mockCountries as any);
      service.filterCountries('united');

      // Should find matches regardless of case
      expect(service.filteredCountries().length).toBe(2);
    });

    it('should handle setupValidation method', () => {
      // Test that setupValidation doesn't throw errors
      expect(() => (service as any).setupValidation()).not.toThrow();
    });

    it('should handle autoSelectCountry when geo IP service fails', async () => {
      jest.spyOn(geoIpService, 'geoIpLookup').mockReturnValue(of(null as any));

      await (service as any).autoSelectCountry();

      // Should not throw and should handle gracefully
      expect(service.selectedCountry()).toBeNull();
    });

    it('should test max input length signal', () => {
      // Test the signal getter
      expect(service.maxInputLength()).toBe(15); // Default value
    });

    it('should handle setRequired method', () => {
      service.setRequired(true);

      // Should not throw error
      expect(service).toBeTruthy();
    });

    it('should handle initialization with empty config object', async () => {
      await service.initialize({});

      expect(service.isLoading()).toBe(false);
    });

    it('should handle filtering by dial code', () => {
      const mockCountries = [
        { name: 'United States', iso2: 'us', dialCode: '1' },
        { name: 'United Kingdom', iso2: 'gb', dialCode: '44' }
      ];

      service['_allCountries'].set(mockCountries as any);
      service.filterCountries('44');

      expect(service.filteredCountries().length).toBe(1);
      expect(service.filteredCountries()[0].dialCode).toBe('44');
    });

    it('should handle filtering by ISO code', () => {
      const mockCountries = [
        { name: 'United States', iso2: 'us', dialCode: '1' },
        { name: 'United Kingdom', iso2: 'gb', dialCode: '44' }
      ];

      service['_allCountries'].set(mockCountries as any);
      service.filterCountries('gb');

      expect(service.filteredCountries().length).toBe(1);
      expect(service.filteredCountries()[0].iso2).toBe('gb');
    });

    it('should handle partial name matches in filtering', () => {
      const mockCountries = [
        { name: 'United States', iso2: 'us', dialCode: '1' },
        { name: 'United Kingdom', iso2: 'gb', dialCode: '44' },
        { name: 'United Arab Emirates', iso2: 'ae', dialCode: '971' }
      ];

      service['_allCountries'].set(mockCountries as any);
      service.filterCountries('Unit');

      expect(service.filteredCountries().length).toBe(3);
    });
  });
});
