import { expect, test } from '@playwright/test';
import {
  countrySelect,
  gotoHarness,
  pasteIntoInput,
  telInput,
  typeDigits
} from './harness';

const numberField = '.number-form-field';

/**
 * `mirrorValidationToNumberControl` exists only so the number input renders in
 * its error state alongside the field — a purely visual effect that no unit
 * test can see. The `mat-error` messages are rendered from the field control's
 * errors and are equally browser-only.
 */
test.describe('validation feedback', () => {
  test('renders the invalid-number error and marks the input invalid', async ({
    page
  }) => {
    await gotoHarness(page);

    await typeDigits(page, '612');
    await telInput(page).blur();

    await expect(page.getByTestId('status')).toHaveText('INVALID');
    await expect(page.locator('mat-error')).toHaveText('Number is not valid');
    await expect(telInput(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator(numberField)).toHaveClass(
      /mat-form-field-invalid/
    );
  });

  test('clears the error state once the number becomes valid', async ({
    page
  }) => {
    await gotoHarness(page);
    await typeDigits(page, '612');
    await telInput(page).blur();
    await expect(page.locator(numberField)).toHaveClass(
      /mat-form-field-invalid/
    );

    await telInput(page).click();
    await typeDigits(page, '345678');

    await expect(page.getByTestId('status')).toHaveText('VALID');
    await expect(page.locator('mat-error')).toHaveCount(0);
    await expect(page.locator(numberField)).not.toHaveClass(
      /mat-form-field-invalid/
    );
    await expect(telInput(page)).toHaveAttribute('aria-invalid', 'false');
  });

  test('renders the required error once the field has been emptied', async ({
    page
  }) => {
    await gotoHarness(page);
    await typeDigits(page, '612345678');

    await telInput(page).fill('');

    await expect(page.locator('mat-error')).toHaveText(
      'This field is required'
    );
    await expect(page.getByTestId('status')).toHaveText('INVALID');
  });

  // the Signal Forms path emits `touch`; the Reactive Forms control used to be
  // left untouched forever, so consumers could not use the standard
  // touched-based error display
  test('marks the reactive control touched on blur', async ({ page }) => {
    await gotoHarness(page);

    await expect(page.getByTestId('touched')).toHaveText('false');

    await telInput(page).click();
    await telInput(page).blur();

    await expect(page.getByTestId('touched')).toHaveText('true');
  });
});

/**
 * `enableInputMaxLength` caps the input with a `maxlength` attribute so the
 * browser stops the user past a country's longest number. The cap is lifted
 * while the field is empty or holds a `+` number, otherwise a paste is
 * truncated before the component can read it — only observable in a browser.
 */
/**
 * The length budget comes from the number's own country. It used to come from
 * the selected one, so a valid number whose country is not in the list was
 * measured against whatever happened to be selected: a Chinese number (11
 * national digits) reported "too long" while Saint Helena (5) was selected.
 */
test.describe('numberTooLong', () => {
  test('measures a number against its own country, not the selected one', async ({
    page
  }) => {
    await page.goto('/e2e?excludedCountries=cn&autoSelectedCountry=sh');
    await expect(countrySelect(page)).toContainText('+290');

    await page.getByTestId('set-value').fill('+8613800138000');
    await page.getByTestId('apply-value').click();

    await expect(page.getByTestId('value')).toHaveText('+86 138 0013 8000');
    await expect(page.getByTestId('status')).toHaveText('VALID');
    await expect(page.locator('mat-error')).toHaveCount(0);
  });
});

// Well past Spain's 9 national digits, but short enough that
// google-libphonenumber can still round-trip it: its JS port keeps the
// national number in a double, so from 17 digits up the value comes back
// corrupted (61234567890123456 -> 61234567890123460). That is a limit of the
// parser, not of this component, and the default maxlength keeps users well
// clear of it — these specs stay below the cliff so they assert the input
// bound and nothing else.
const OVERLONG = '612345678901234';

test.describe('enableInputMaxLength', () => {
  test('stops typing past the country maximum', async ({ page }) => {
    await gotoHarness(page);

    await typeDigits(page, OVERLONG);

    const maxLength = Number(await telInput(page).getAttribute('maxlength'));
    const value = await telInput(page).inputValue();
    expect(value.length).toBeLessThanOrEqual(maxLength);
    expect(value.length).toBeLessThan(OVERLONG.length);
  });

  test('sets no attribute at all when disabled, so typing is unbounded', async ({
    page
  }) => {
    await gotoHarness(page, { enableInputMaxLength: false });

    await expect(telInput(page)).not.toHaveAttribute('maxlength');

    await typeDigits(page, OVERLONG);

    await expect(telInput(page)).toHaveValue(OVERLONG);
    await expect(page.getByTestId('status')).toHaveText('INVALID');
  });

  test('does not truncate a paste into the empty field', async ({ page }) => {
    await gotoHarness(page);

    // the cap is lifted while the field is empty, so the whole paste reaches
    // the component and is rejected on its merits rather than silently cut
    await pasteIntoInput(page, OVERLONG);

    await expect(telInput(page)).toHaveValue(OVERLONG);
    await expect(page.getByTestId('status')).toHaveText('INVALID');
  });
});
