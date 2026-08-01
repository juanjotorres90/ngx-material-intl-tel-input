import { expect, test } from '@playwright/test';
import { countrySelect, gotoHarness, telInput, typeDigits } from './harness';

/**
 * A parent form reset must clear the visible input, not just the control
 * (fixed in 19.2.0 and only observable in a browser).
 */
test.describe('form reset', () => {
  for (const useMask of [false, true]) {
    test(`clears the number input with useMask=${useMask}`, async ({
      page
    }) => {
      await gotoHarness(page, { useMask });
      await typeDigits(page, '612345678');
      await expect(page.getByTestId('status')).toHaveText('VALID');

      await page.getByTestId('reset').click();

      await expect(telInput(page)).toHaveValue('');
      await expect(page.getByTestId('value')).toBeEmpty();
      await expect(page.getByTestId('status')).toHaveText('INVALID');
      // the country selection survives a reset
      await expect(countrySelect(page)).toContainText('+34');
    });
  }
});
