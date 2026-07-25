import { PhoneNumberUtil } from 'google-libphonenumber';
import { CountryCode } from './country-code';

describe('CountryCode data', () => {
  // Regression guard: territories sharing a calling code used to be listed with
  // the area code merged into the dial code (Northern Mariana Islands as
  // '1670', Dominica as '1767', ...). That made '+' + dialCode + nationalNumber
  // unparseable and forced per-country special cases across the library.
  it('should store the calling code as the dial code, with area codes kept apart', () => {
    const phoneNumberUtil = PhoneNumberUtil.getInstance();

    const mismatches = new CountryCode().allCountries
      .filter(
        ([, , iso2, dialCode]) =>
          phoneNumberUtil
            .getCountryCodeForRegion(iso2.toUpperCase())
            .toString() !== dialCode
      )
      .map(([, name, iso2, dialCode]) => `${name} (${iso2}): ${dialCode}`);

    expect(mismatches).toEqual([]);
  });
});
