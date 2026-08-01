import { expect, test } from '@playwright/test';
import { countrySelect, gotoHarness, telInput, typeDigits } from './harness';

const SWISS_NUMBER = '+41446681800';

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

  // the field is the source of truth, so a write to the model signal has to
  // repaint the selector and the input the same way a Reactive Forms
  // `setValue` does
  test('repaints from a write to the model signal', async ({ page }) => {
    await gotoHarness(page, { forms: 'signal' });

    await page.getByTestId('signal-set-value').fill(SWISS_NUMBER);
    await page.getByTestId('signal-apply-value').click();

    await expect(countrySelect(page)).toContainText('+41');
    await expect(telInput(page)).toHaveValue('044 668 18 00');
    await expect(page.getByTestId('signal-value')).toHaveText(
      '+41 44 668 18 00'
    );
    await expect(page.getByTestId('signal-valid')).toHaveText('true');
  });

  test('reflects a schema disabled() rule in the input', async ({ page }) => {
    await gotoHarness(page, { forms: 'signal' });

    await expect(page.getByTestId('signal-disabled')).toHaveText('false');
    await expect(telInput(page)).toBeEnabled();

    await page.getByTestId('signal-toggle-disabled').click();

    await expect(page.getByTestId('signal-disabled')).toHaveText('true');
    await expect(telInput(page)).toBeDisabled();

    await page.getByTestId('signal-toggle-disabled').click();

    await expect(telInput(page)).toBeEnabled();
  });

  // `FieldState.reset()` is documented to clear touched/dirty and leave the
  // data model alone — so the number must survive, and the component must not
  // repaint itself off a state-only reset
  test('clears only the touched and dirty state on a bare reset', async ({
    page
  }) => {
    await gotoHarness(page, { forms: 'signal' });
    await typeDigits(page, '612345678');
    await telInput(page).blur();
    await expect(page.getByTestId('signal-touched')).toHaveText('true');
    await expect(page.getByTestId('signal-dirty')).toHaveText('true');

    await page.getByTestId('signal-reset').click();

    await expect(page.getByTestId('signal-touched')).toHaveText('false');
    await expect(page.getByTestId('signal-dirty')).toHaveText('false');
    await expect(telInput(page)).toHaveValue('612 34 56 78');
    await expect(page.getByTestId('signal-value')).toHaveText(
      '+34 612 34 56 78'
    );
    await expect(page.getByTestId('signal-valid')).toHaveText('true');
  });

  test('clears the input when reset is given an empty value', async ({
    page
  }) => {
    await gotoHarness(page, { forms: 'signal' });
    await typeDigits(page, '612345678');
    await telInput(page).blur();

    await page.getByTestId('signal-reset-value').click();

    await expect(telInput(page)).toHaveValue('');
    await expect(page.getByTestId('signal-value')).toBeEmpty();
    await expect(page.getByTestId('signal-touched')).toHaveText('false');
    // required() applies again to the emptied field
    await expect(page.getByTestId('signal-valid')).toHaveText('false');
    // and the country selection survives, as it does for a reactive reset
    await expect(countrySelect(page)).toContainText('+34');
  });

  test('reports the field dirty once the user types', async ({ page }) => {
    await gotoHarness(page, { forms: 'signal' });

    await expect(page.getByTestId('signal-dirty')).toHaveText('false');

    await typeDigits(page, '612');

    await expect(page.getByTestId('signal-dirty')).toHaveText('true');
  });

  test('keeps submit blocked while the number is invalid', async ({ page }) => {
    await gotoHarness(page, { forms: 'signal' });

    await typeDigits(page, '612345');
    await telInput(page).blur();

    await expect(page.getByTestId('signal-valid')).toHaveText('false');
    await expect(page.getByTestId('signal-submit')).toBeDisabled();
    await expect(page.getByTestId('signal-submitted')).toBeEmpty();
  });
});
