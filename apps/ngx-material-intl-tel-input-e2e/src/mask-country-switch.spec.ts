import { expect, test } from '@playwright/test';
import {
  countrySelect,
  gotoHarness,
  selectCountry,
  telInput,
  typeDigits
} from './harness';

/**
 * Covers two 22.1.0 fixes:
 * - dial codes containing `0`/`9` (IMask definition characters) must render as
 *   literals, not editable slots (+380 Ukraine, +90 Turkey);
 * - changing the country must clear the number instead of pushing it through
 *   the previous mask, which made the validator revert the selection.
 */
test.describe('country switch with a mask', () => {
  test('clears the number and renders the new dial code as literals', async ({
    page
  }) => {
    await gotoHarness(page, {
      useMask: true,
      includeDialCode: true,
      forceSelectedCountryCode: true,
      showMaskPlaceholder: true
    });
    await typeDigits(page, '612345678');
    await expect(telInput(page)).toHaveValue('+34 612 34 56 78');

    await selectCountry(page, 'Ukraine');

    // +380 stays literal: the 0 is not an editable slot
    await expect(telInput(page)).toHaveValue('+380 __ ___ ____');
    // and the validator does not revert the selection to the old country
    // with includeDialCode the trigger shows the ISO code, not the dial code
    await expect(countrySelect(page)).toContainText('UA');

    await typeDigits(page, '441234567');

    await expect(telInput(page)).toHaveValue('+380 44 123 4567');
    await expect(page.getByTestId('value')).toHaveText('+380 44 123 4567');
    await expect(page.getByTestId('status')).toHaveText('VALID');
  });
});
