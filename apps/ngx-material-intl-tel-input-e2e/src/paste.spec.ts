import { expect, test } from '@playwright/test';
import {
  countrySelect,
  gotoHarness,
  pasteIntoInput,
  telInput
} from './harness';

/**
 * Pasting is a different input path than typing: imask and the value listener
 * see one bulk change instead of a keystroke sequence.
 */
test.describe('pasting a number', () => {
  for (const useMask of [false, true]) {
    test(`accepts a national number with useMask=${useMask}`, async ({
      page
    }) => {
      await gotoHarness(page, { useMask });

      await pasteIntoInput(page, '612345678');

      await expect(telInput(page)).toHaveValue('612 34 56 78');
      await expect(page.getByTestId('value')).toHaveText('+34 612 34 56 78');
      await expect(page.getByTestId('status')).toHaveText('VALID');
    });
  }

  // Regression guard: the selected country's dial code used to be prepended
  // unconditionally, so pasting a foreign number while Spain was selected
  // emitted the unparseable "+34+41 44 668 18 " — and the national maxlength
  // truncated the paste before the component even saw it.
  test('switches country when a full international number is pasted', async ({
    page
  }) => {
    await gotoHarness(page);

    await pasteIntoInput(page, '+41 44 668 18 00');

    await expect(countrySelect(page)).toContainText('+41');
    await expect(page.getByTestId('value')).toHaveText('+41 44 668 18 00');
    await expect(page.getByTestId('status')).toHaveText('VALID');
    // and the input settles into the new country's national format
    await expect(telInput(page)).toHaveValue('044 668 18 00');
  });

  test('accepts an international number typed by hand', async ({ page }) => {
    await gotoHarness(page);

    await telInput(page).click();
    await telInput(page).pressSequentially('+41446681800', { delay: 40 });

    await expect(countrySelect(page)).toContainText('+41');
    await expect(page.getByTestId('value')).toHaveText('+41 44 668 18 00');
    await expect(page.getByTestId('status')).toHaveText('VALID');
  });
});
