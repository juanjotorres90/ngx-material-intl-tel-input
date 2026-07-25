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

/**
 * The mask is built from the country's example number, so a territory whose
 * area code lives in `areaCodes` rather than `dialCode` is where the mask and
 * the dial prefix can disagree. Masked input also takes the other branch of
 * the country-change handler, which clears and remasks instead of writing the
 * prefix directly.
 */
test.describe('shared dial codes with a mask', () => {
  test('masks a national number that carries its area code', async ({
    page
  }) => {
    await gotoHarness(page, { useMask: true });

    await selectCountry(page, 'Northern Mariana Islands');
    await typeDigits(page, '6702345678');

    await expect(telInput(page)).toHaveValue('(670) 234-5678');
    await expect(page.getByTestId('value')).toHaveText('+1 670-234-5678');
    await expect(page.getByTestId('status')).toHaveText('VALID');
  });

  // Only the shared calling code is a mask literal — the area code stays an
  // editable slot, so the user types all ten national digits. This is the one
  // place `getCountryDialPrefix` does not apply: the mask branch of the
  // country-change handler clears the input instead of writing a prefix.
  test('keeps only the calling code literal with includeDialCode', async ({
    page
  }) => {
    await gotoHarness(page, {
      useMask: true,
      includeDialCode: true,
      forceSelectedCountryCode: true,
      showMaskPlaceholder: true
    });

    await selectCountry(page, 'Northern Mariana Islands');

    await expect(telInput(page)).toHaveValue('+1 ___-___-____');

    await typeDigits(page, '6702345678');

    await expect(telInput(page)).toHaveValue('+1 670-234-5678');
    await expect(page.getByTestId('value')).toHaveText('+1 670-234-5678');
    await expect(page.getByTestId('status')).toHaveText('VALID');
  });

  // Without includeDialCode the mask branch does not clear, so the number
  // survives the country change — and its area code then resolves the country
  // back. The area code wins over the selection, which is what makes these
  // territories distinguishable at all.
  test('lets the area code resolve the country back after a switch', async ({
    page
  }) => {
    await gotoHarness(page, { useMask: true });
    await selectCountry(page, 'Northern Mariana Islands');
    await typeDigits(page, '6702345678');
    await expect(page.getByTestId('status')).toHaveText('VALID');

    await selectCountry(page, 'Jamaica');

    await expect(telInput(page)).toHaveValue('(670) 234-5678');
    await expect(page.getByTestId('value')).toHaveText('+1 670-234-5678');
    await expect(page.getByTestId('status')).toHaveText('VALID');
  });
});
