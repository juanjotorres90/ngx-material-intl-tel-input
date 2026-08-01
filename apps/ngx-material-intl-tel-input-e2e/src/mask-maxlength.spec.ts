import { expect, test } from '@playwright/test';
import { gotoHarness, telInput, typeDigits } from './harness';

/**
 * With `useMask`, the placeholder characters fill the input to its exact
 * length, so a `maxlength` attribute blocked typing entirely. The mask itself
 * enforces the length; `maxlength` is only for the unmasked input.
 */
test.describe('maxlength interaction with useMask', () => {
  test('is not applied in mask mode, so the full number can be typed', async ({
    page
  }) => {
    await gotoHarness(page, {
      useMask: true,
      includeDialCode: true,
      forceSelectedCountryCode: true,
      showMaskPlaceholder: true
    });

    await expect(telInput(page)).not.toHaveAttribute('maxlength');

    await typeDigits(page, '612345678');

    await expect(telInput(page)).toHaveValue('+34 612 34 56 78');
  });

  test('is still applied when the mask is off', async ({ page }) => {
    await gotoHarness(page);

    await expect(telInput(page)).toHaveAttribute('maxlength', /\d+/);
  });
});
