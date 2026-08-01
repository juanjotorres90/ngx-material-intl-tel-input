import { expect, test } from '@playwright/test';
import { countrySelect, gotoHarness, telInput } from './harness';

const SWISS_NUMBER = '+41446681800';

/**
 * A value written to the control from outside the component (Reactive Forms
 * `setValue`) must repaint both the country selector and the number input —
 * including when `numberValidation` is off, where previously only the
 * validator's side effects updated the visible input.
 */
test.describe('external control writes', () => {
  for (const numberValidation of [true, false]) {
    test(`repaint the selector and input with numberValidation=${numberValidation}`, async ({
      page
    }) => {
      await gotoHarness(page, { numberValidation });

      await page.getByTestId('set-value').fill(SWISS_NUMBER);
      await page.getByTestId('apply-value').click();

      await expect(countrySelect(page)).toContainText('+41');
      await expect(telInput(page)).toHaveValue('044 668 18 00');
      await expect(page.getByTestId('value')).toHaveText('+41 44 668 18 00');
    });
  }

  test('reflect a disabled control in the UI', async ({ page }) => {
    await gotoHarness(page);

    await page.getByTestId('toggle-disabled').click();

    await expect(telInput(page)).toBeDisabled();
    await expect(page.getByTestId('status')).toHaveText('DISABLED');

    await page.getByTestId('toggle-disabled').click();

    await expect(telInput(page)).toBeEnabled();
  });
});
