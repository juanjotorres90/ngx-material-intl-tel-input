import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';
import { Country } from '../types/country.model';
import {
  findCountryByParsedNumber,
  formatForNumberInput,
  resolveCountrySequence
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
        outputNumberFormat: PhoneNumberFormat.INTERNATIONAL,
        selectedDialCode: '41'
      })
    ).toBe('044 668 18 00');
  });

  it('should use the output format when includeDialCode is enabled', () => {
    expect(
      formatForNumberInput(parsed, {
        includeDialCode: true,
        outputNumberFormat: PhoneNumberFormat.INTERNATIONAL,
        selectedDialCode: '41'
      })
    ).toBe('+41 44 668 18 00');

    expect(
      formatForNumberInput(parsed, {
        includeDialCode: true,
        outputNumberFormat: PhoneNumberFormat.E164,
        selectedDialCode: '41'
      })
    ).toBe('+41446681800');
  });

  it('should use the national format for Northern Mariana Islands like any other country', () => {
    const mpNumber = phoneNumberUtil.parse('+1 670 234 5678');

    expect(
      formatForNumberInput(mpNumber, {
        includeDialCode: false,
        outputNumberFormat: PhoneNumberFormat.INTERNATIONAL,
        selectedDialCode: '1'
      })
    ).toBe('(670) 234-5678');
  });

  it('should keep the calling code when no country is selected', () => {
    // the national format would leave the number with no way back to +41: the
    // selected country is what puts the calling code back
    expect(
      formatForNumberInput(parsed, {
        includeDialCode: false,
        outputNumberFormat: PhoneNumberFormat.INTERNATIONAL,
        selectedDialCode: undefined
      })
    ).toBe('+41 44 668 18 00');
  });

  it('should keep the calling code when the selected country is not the number own', () => {
    expect(
      formatForNumberInput(parsed, {
        includeDialCode: false,
        outputNumberFormat: PhoneNumberFormat.INTERNATIONAL,
        selectedDialCode: '34'
      })
    ).toBe('+41 44 668 18 00');
  });

  it('should keep the calling code in the configured output format', () => {
    expect(
      formatForNumberInput(parsed, {
        includeDialCode: false,
        outputNumberFormat: PhoneNumberFormat.E164,
        selectedDialCode: '34'
      })
    ).toBe('+41446681800');
  });
});

describe('resolveCountrySequence', () => {
  const countries: Country[] = [
    country({ name: 'Spain', iso2: 'es', dialCode: '34', priority: 0 }),
    country({ name: 'Switzerland', iso2: 'ch', dialCode: '41', priority: 0 })
  ];

  it('should resolve only from the parsed number when includeDialCode is off', () => {
    const parsed = phoneNumberUtil.parse('+41 44 668 18 00');

    const sequence = resolveCountrySequence(parsed, countries, {
      includeDialCode: false,
      currentIso: 'es',
      currentDialCode: '34'
    });

    expect(sequence.fromDialCode).toBeUndefined();
    expect(sequence.fromParsed?.iso2).toBe('ch');
  });

  it('should resolve from the selected dial code first, then from the number', () => {
    const parsed = phoneNumberUtil.parse('+41 44 668 18 00');

    const sequence = resolveCountrySequence(parsed, countries, {
      includeDialCode: true,
      currentIso: 'es',
      currentDialCode: '34'
    });

    // the two resolutions disagree: both are reported, and the caller applies
    // them in order so the parsed one is where the selector lands
    expect(sequence.fromDialCode?.iso2).toBe('es');
    expect(sequence.fromParsed?.iso2).toBe('ch');
  });

  it('should resolve nothing when the dial code matches no country', () => {
    const parsed = phoneNumberUtil.parse('+41 44 668 18 00');

    const sequence = resolveCountrySequence(parsed, [], {
      includeDialCode: true,
      currentIso: 'es',
      currentDialCode: '999'
    });

    // an empty sequence leaves the selection alone
    expect(sequence.fromDialCode).toBeUndefined();
    expect(sequence.fromParsed).toBeUndefined();
  });

  it('should fall back to the parsed country code when nothing is selected', () => {
    const parsed = phoneNumberUtil.parse('+34 612 34 56 78');

    const sequence = resolveCountrySequence(parsed, countries, {
      includeDialCode: true
    });

    expect(sequence.fromDialCode?.iso2).toBe('es');
    expect(sequence.fromParsed?.iso2).toBe('es');
  });

  describe('a number still inside the selected area code', () => {
    // the +1 family in country-code.ts order: area-code entries first, the
    // priority-0 country last
    const northAmerica: Country[] = [
      country({
        name: 'Jamaica',
        iso2: 'jm',
        dialCode: '1',
        priority: 1,
        areaCodes: ['876']
      }),
      country({ name: 'United States', iso2: 'us', dialCode: '1', priority: 0 })
    ];

    it('should keep the selected country while its area code is unfinished', () => {
      // deleting a digit out of the prefilled '+1 876'
      const parsed = phoneNumberUtil.parse('+1 87');

      const sequence = resolveCountrySequence(parsed, northAmerica, {
        includeDialCode: true,
        currentIso: 'jm',
        currentDialCode: '1'
      });

      // nothing to apply: the selection already holds the country
      expect(sequence.fromDialCode).toBeUndefined();
      expect(sequence.fromParsed).toBeUndefined();
    });

    it('should resolve again as soon as the area code is complete', () => {
      const parsed = phoneNumberUtil.parse('+1 876');

      const sequence = resolveCountrySequence(parsed, northAmerica, {
        includeDialCode: true,
        currentIso: 'jm',
        currentDialCode: '1'
      });

      expect(sequence.fromParsed?.iso2).toBe('jm');
    });

    it('should hand the number over once it belongs to another area code', () => {
      const parsed = phoneNumberUtil.parse('+1 202 555 0123');

      const sequence = resolveCountrySequence(parsed, northAmerica, {
        includeDialCode: true,
        currentIso: 'jm',
        currentDialCode: '1'
      });

      expect(sequence.fromParsed?.iso2).toBe('us');
    });

    it('should not hold a number from a different calling code', () => {
      const parsed = phoneNumberUtil.parse('+34 61');
      const withSpain = [
        ...northAmerica,
        country({ name: 'Spain', iso2: 'es', dialCode: '34', priority: 0 })
      ];

      const sequence = resolveCountrySequence(parsed, withSpain, {
        includeDialCode: true,
        currentIso: 'jm',
        currentDialCode: '1'
      });

      expect(sequence.fromParsed?.iso2).toBe('es');
    });

    it('should not hold anything for a country without area codes', () => {
      const parsed = phoneNumberUtil.parse('+34 61');

      const sequence = resolveCountrySequence(parsed, countries, {
        includeDialCode: true,
        currentIso: 'es',
        currentDialCode: '34'
      });

      expect(sequence.fromParsed?.iso2).toBe('es');
    });
  });
});
