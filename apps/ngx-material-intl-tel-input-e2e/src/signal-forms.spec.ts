import { expect, test } from '@playwright/test';
import { gotoHarness, telInput, typeDigits } from './harness';

/**
 * The Signal Forms contract added in 22.1.0: the component is a
 * `FormValueControl<string>`, so `[formField]` drives its value, blur marks the
 * field touched, and the exported `validPhoneNumber` validator gates submission.
 */
test.describe('Signal Forms binding', () => {
  test('drives the model, touched state and submit', async ({ page }) => {
    await gotoHarness(page, { forms: 'signal' });

    await expect(page.getByTestId('signal-valid')).toHaveText('false');
    await expect(page.getByTestId('signal-submit')).toBeDisabled();

    await typeDigits(page, '612');

    await expect(page.getByTestId('signal-valid')).toHaveText('false');
    await expect(page.getByTestId('signal-submit')).toBeDisabled();

    await typeDigits(page, '345678');

    await expect(page.getByTestId('signal-value')).toHaveText(
      '+34 612 34 56 78'
    );
    await expect(page.getByTestId('signal-valid')).toHaveText('true');

    await expect(page.getByTestId('signal-touched')).toHaveText('false');
    await telInput(page).blur();
    await expect(page.getByTestId('signal-touched')).toHaveText('true');

    await page.getByTestId('signal-submit').click();

    await expect(page.getByTestId('signal-submitted')).toHaveText(
      '+34 612 34 56 78'
    );
  });
});
