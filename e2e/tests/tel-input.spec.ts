import { expect, test } from '@playwright/test';

test.describe('ngx-material-intl-tel-input demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('selects the default country and shows its dial code', async ({
    page
  }) => {
    // Default country is Spain (no geo-IP lookup by default)
    await expect(page.locator('mat-select')).toContainText('+34');
  });

  test('formats a typed national number and validates the form', async ({
    page
  }) => {
    const input = page.locator('input[type="tel"]');
    await expect(page.locator('mat-select')).toContainText('+34');

    await input.fill('612345678');

    // Input reformats to the national grouping and the returned value is international
    await expect(input).toHaveValue('612 34 56 78');
    await expect(page.getByText('Returned value:')).toBeVisible();
    await expect(page.locator('mat-chip').first()).toContainText(
      '+34 612 34 56 78'
    );
    await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();
  });

  test('shows a validation error for an invalid number', async ({ page }) => {
    const input = page.locator('input[type="tel"]');
    await input.fill('123');
    await input.blur();

    await expect(page.getByText('Number is not valid')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  test('switches country through the searchable dropdown', async ({ page }) => {
    await page.locator('mat-select').click();
    // The search input is auto-focused inside an aria-disabled mat-option,
    // so type via the keyboard instead of fill()
    await expect(
      page.getByRole('textbox', { name: 'dropdown search' })
    ).toBeFocused();
    await page.keyboard.type('united states');
    await page
      .getByRole('option', { name: /United States/ })
      .first()
      .click();

    await expect(page.locator('mat-select')).toContainText('+1');

    const input = page.locator('input[type="tel"]');
    await input.fill('2015550123');
    await expect(page.locator('mat-chip').first()).toContainText(
      '+1 201 555 0123'
    );
  });

  test('allows deleting digits for NANP territories', async ({ page }) => {
    await page.locator('mat-select').click();
    await page.keyboard.type('dominica');
    await page
      .getByRole('option', { name: /Dominica/ })
      .first()
      .click();

    const input = page.locator('input[type="tel"]');
    await input.fill('767');
    await expect(input).toHaveValue('767');

    await input.press('Backspace');

    await expect(input).toHaveValue('76');
    await expect(page.locator('mat-select')).toContainText('+1767');
    await expect(page.locator('mat-chip').first()).toContainText('+1 76');
  });

  test('writes and resets values through ControlValueAccessor', async ({
    page
  }) => {
    await page.getByRole('checkbox').check();
    await page.getByLabel('Set phone number').fill('+34612345678');
    await page.getByRole('button', { name: 'Set phone number' }).click();

    await expect(page.locator('input[type="tel"]')).toHaveValue('612 34 56 78');
    await expect(page.getByText('No value returned')).toBeVisible();

    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.locator('mat-chip').first()).toContainText(
      '+34612345678'
    );

    await page.getByRole('button', { name: 'Reset' }).click();

    await expect(page.locator('input[type="tel"]')).toHaveValue('');
  });
});
