import { expect, test } from '@playwright/test';
import {
  expectCaretNeverGoesBackwards,
  gotoHarness,
  telInput,
  typeDigits
} from './harness';

/**
 * Without a mask the component reformats the input itself and restores the
 * caret through `setCursorPosition`/`adjustCursorPosition`. That path is still
 * live for every non-mask user and is where the cursor regressions of 19.2.0,
 * 19.2.1, 20.0.0 and 20.1.2 lived — one branch per configuration below.
 */
test.describe('caret without a mask', () => {
  test('reformats on the last digit without pulling the caret back', async ({
    page
  }) => {
    await gotoHarness(page);

    const carets = await typeDigits(page, '612345678');

    // the value stays unformatted until the number is valid, then snaps to
    // national formatting with the caret at the end
    await expect(telInput(page)).toHaveValue('612 34 56 78');
    expectCaretNeverGoesBackwards(carets);
    await expect(page.getByTestId('value')).toHaveText('+34 612 34 56 78');
    await expect(page.getByTestId('status')).toHaveText('VALID');
  });

  test('leaves the input unformatted when numberValidation is off', async ({
    page
  }) => {
    await gotoHarness(page, { numberValidation: false });

    const carets = await typeDigits(page, '612345678');

    await expect(telInput(page)).toHaveValue('612345678');
    expectCaretNeverGoesBackwards(carets);
    // the emitted value is still the formatted international number
    await expect(page.getByTestId('value')).toHaveText('+34 612 34 56 78');
  });

  test('keeps the caret ahead with includeDialCode', async ({ page }) => {
    await gotoHarness(page, { includeDialCode: true });

    const carets = await typeDigits(page, '612345678');

    await expect(telInput(page)).toHaveValue('+34 612 34 56 78');
    expectCaretNeverGoesBackwards(carets);
    await expect(page.getByTestId('value')).toHaveText('+34 612 34 56 78');
  });

  const outputFormats = [
    { outputNumberFormat: 'E164', emitted: '+34612345678' },
    { outputNumberFormat: 'RFC3966', emitted: 'tel:+34-612-34-56-78' }
  ];

  for (const { outputNumberFormat, emitted } of outputFormats) {
    test(`keeps the caret ahead with outputNumberFormat=${outputNumberFormat}`, async ({
      page
    }) => {
      await gotoHarness(page, { outputNumberFormat });

      const carets = await typeDigits(page, '612345678');

      // the input always shows the national format; only the emitted value
      // follows outputNumberFormat, and the caret math must not follow it
      await expect(telInput(page)).toHaveValue('612 34 56 78');
      expectCaretNeverGoesBackwards(carets);
      await expect(page.getByTestId('value')).toHaveText(emitted);
    });
  }
});
