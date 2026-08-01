import { expect, test } from '@playwright/test';
import {
  expectCaretNeverGoesBackwards,
  gotoHarness,
  telInput,
  typeDigits
} from './harness';

/**
 * Regression guard for
 * https://github.com/juanjotorres90/ngx-material-intl-tel-input/issues/80.
 *
 * Before the fix the component restored a caret position captured before IMask
 * repositioned past the mask separators, so the caret trailed one character
 * behind and typing 612345678 produced "+34 612 45 78 63".
 */
test.describe('useMask caret handling', () => {
  test('keeps the caret ahead of the typed digits', async ({ page }) => {
    await gotoHarness(page, { useMask: true });

    const carets = await typeDigits(page, '612345678');

    await expect(telInput(page)).toHaveValue('612 34 56 78');
    expectCaretNeverGoesBackwards(carets);
    await expect(page.getByTestId('value')).toHaveText('+34 612 34 56 78');
    await expect(page.getByTestId('status')).toHaveText('VALID');
  });

  test('keeps the caret ahead of the typed digits with includeDialCode', async ({
    page
  }) => {
    await gotoHarness(page, {
      useMask: true,
      includeDialCode: true,
      forceSelectedCountryCode: true,
      showMaskPlaceholder: true
    });

    const carets = await typeDigits(page, '612345678');

    await expect(telInput(page)).toHaveValue('+34 612 34 56 78');
    expectCaretNeverGoesBackwards(carets);
    await expect(page.getByTestId('value')).toHaveText('+34 612 34 56 78');
  });
});
