import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';
import { Country } from '../types/country.model';
import {
  findCountryByParsedNumber,
  formatForNumberInput
} from './country.utils';

const phoneNumberUtil = PhoneNumberUtil.getInstance();

const country = (overrides: Partial<Country>): Country =>
  ({
    emojiFlag: '🏳️',
    name: 'Country',
    iso2: 'xx',
    dialCode: '1',
    priority: 0,
    htmlId: 'xx',
    flagClass: 'xx',
    placeHolder: '',
    ...overrides
  }) as Country;

describe('findCountryByParsedNumber', () => {
  // countries sharing +1: the area-code entries must come first, exactly as in
  // country-code.ts, for the area-code branch to win over the priority-0 one
  const northAmerica: Country[] = [
    country({
      name: 'Dominica',
      iso2: 'dm',
      dialCode: '1',
      priority: 1,
      areaCodes: ['767']
    }),
    country({
      name: 'Grenada',
      iso2: 'gd',
      dialCode: '1',
      priority: 1,
      areaCodes: ['473']
    }),
    country({ name: 'United States', iso2: 'us', dialCode: '1', priority: 0 })
  ];

  it('should match a country by its dial code when it has no area codes', () => {
    const parsed = phoneNumberUtil.parse('+1 201 555 0123');

    expect(findCountryByParsedNumber(parsed, northAmerica)?.iso2).toBe('us');
  });

  it('should prefer the country whose area code matches the national number', () => {
    const parsed = phoneNumberUtil.parse('+1 767 225 1234');

    expect(findCountryByParsedNumber(parsed, northAmerica)?.iso2).toBe('dm');
  });

  it('should skip a country that has neither a matching area code nor priority 0', () => {
    const parsed = phoneNumberUtil.parse('+1 201 555 0123');
    const onlyNonPriority = [
      country({ iso2: 'xx', dialCode: '1', priority: 1 })
    ];

    expect(findCountryByParsedNumber(parsed, onlyNonPriority)).toBeUndefined();
  });

  it('should return undefined when no country shares the dial code', () => {
    const parsed = phoneNumberUtil.parse('+34 612 34 56 78');

    expect(findCountryByParsedNumber(parsed, northAmerica)).toBeUndefined();
  });

  it('should accept an explicit country code instead of the parsed one', () => {
    const parsed = phoneNumberUtil.parse('+34 612 34 56 78');
    const spain = [country({ iso2: 'es', dialCode: '34', priority: 0 })];

    // the validator passes the selected country's dial code when
    // includeDialCode is on, rather than the parsed number's
    expect(findCountryByParsedNumber(parsed, spain, '34')?.iso2).toBe('es');
    expect(findCountryByParsedNumber(parsed, spain, '1')).toBeUndefined();
  });
});

describe('formatForNumberInput', () => {
  const parsed = phoneNumberUtil.parse('+41 44 668 18 00');

  it('should use the national format when the dial code is not part of the input', () => {
    expect(
      formatForNumberInput(parsed, {
        includeDialCode: false,
        iso2: 'ch',
        outputNumberFormat: PhoneNumberFormat.INTERNATIONAL
      })
    ).toBe('044 668 18 00');
  });

  it('should use the output format when includeDialCode is enabled', () => {
    expect(
      formatForNumberInput(parsed, {
        includeDialCode: true,
        iso2: 'ch',
        outputNumberFormat: PhoneNumberFormat.INTERNATIONAL
      })
    ).toBe('+41 44 668 18 00');

    expect(
      formatForNumberInput(parsed, {
        includeDialCode: true,
        iso2: 'ch',
        outputNumberFormat: PhoneNumberFormat.E164
      })
    ).toBe('+41446681800');
  });

  it('should use the output format for Northern Mariana Islands even without the dial code', () => {
    const mpNumber = phoneNumberUtil.parse('+1 670 234 5678');

    expect(
      formatForNumberInput(mpNumber, {
        includeDialCode: false,
        iso2: 'mp',
        outputNumberFormat: PhoneNumberFormat.INTERNATIONAL
      })
    ).toBe('+1 670-234-5678');
  });

  it('should fall back to the national format when no country is selected', () => {
    expect(
      formatForNumberInput(parsed, {
        includeDialCode: false,
        outputNumberFormat: PhoneNumberFormat.INTERNATIONAL
      })
    ).toBe('044 668 18 00');
  });
});
