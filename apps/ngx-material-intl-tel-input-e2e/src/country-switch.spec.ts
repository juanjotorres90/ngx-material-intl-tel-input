import { expect, test } from '@playwright/test';
import {
  countrySelect,
  gotoHarness,
  selectCountry,
  telInput,
  typeDigits
} from './harness';

/**
 * Changing the country without a mask, which `mask-country-switch.spec.ts`
 * does not reach: the unmasked branch writes the new dial code straight into
 * the input. The risk in both directions is the validator resolving the
 * number's own country and reverting the selection the user just made.
 */
test.describe('country switch without a mask', () => {
  test('writes the new dial code with includeDialCode', async ({ page }) => {
    await gotoHarness(page, { includeDialCode: true });

    await selectCountry(page, 'Switzerland');

    await expect(telInput(page)).toHaveValue('+41');
    await expect(countrySelect(page)).toContainText('CH');
  });

  test('reinterprets an existing number without reverting the selection', async ({
    page
  }) => {
    await gotoHarness(page);
    await typeDigits(page, '612345678');
    await expect(page.getByTestId('value')).toHaveText('+34 612 34 56 78');

    await selectCountry(page, 'Switzerland');

    // the digits stay, but they are now read as a Swiss number — and the
    // validator must not resolve +41 back to the country it came from
    await expect(countrySelect(page)).toContainText('+41');
    await expect(telInput(page)).toHaveValue('061 234 56 78');
    await expect(page.getByTestId('value')).toHaveText('+41 61 234 56 78');
  });

  test('re-emits the value under the newly selected country', async ({
    page
  }) => {
    await gotoHarness(page);
    await selectCountry(page, 'Switzerland');

    await typeDigits(page, '446681800');

    await expect(telInput(page)).toHaveValue('044 668 18 00');
    await expect(page.getByTestId('value')).toHaveText('+41 44 668 18 00');
    await expect(page.getByTestId('status')).toHaveText('VALID');
  });
});

/**
 * Territories that share a calling code carry the distinguishing digits in
 * `areaCodes`, not in `dialCode`. The dial prefix written into the input has
 * to fold the area code back in (+1 670, not +1), and the national format
 * keeps the area code in the number itself — the maxlength math has to allow
 * for both, which only a browser shows.
 */
test.describe('countries sharing a dial code', () => {
  test('prefills the area code with includeDialCode', async ({ page }) => {
    await gotoHarness(page, { includeDialCode: true });

    await selectCountry(page, 'Northern Mariana Islands');

    await expect(telInput(page)).toHaveValue('+1 670');

    await typeDigits(page, '2345678');

    await expect(page.getByTestId('value')).toHaveText('+1 670-234-5678');
    await expect(page.getByTestId('status')).toHaveText('VALID');
  });

  test('shows the shared dial code and a national number without it', async ({
    page
  }) => {
    await gotoHarness(page);

    await selectCountry(page, 'Northern Mariana Islands');

    // the trigger shows the calling code the territory actually shares
    await expect(countrySelect(page)).toContainText('+1');

    await typeDigits(page, '6702345678');

    // the national format keeps the area code, so maxlength must leave room
    await expect(telInput(page)).toHaveValue('(670) 234-5678');
    await expect(page.getByTestId('value')).toHaveText('+1 670-234-5678');
    await expect(page.getByTestId('status')).toHaveText('VALID');
  });

  test('folds a single area code in for a country that always had one', async ({
    page
  }) => {
    await gotoHarness(page, { includeDialCode: true });

    await selectCountry(page, 'Jamaica');

    await expect(telInput(page)).toHaveValue('+1 876');
  });

  test('leaves the dial code alone when a country has several area codes', async ({
    page
  }) => {
    await gotoHarness(page, { includeDialCode: true });

    await selectCountry(page, 'Puerto Rico');

    await expect(telInput(page)).toHaveValue('+1');
  });
});
