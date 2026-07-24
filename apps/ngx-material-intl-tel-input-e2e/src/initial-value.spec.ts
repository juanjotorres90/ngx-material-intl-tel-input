import { expect, test } from '@playwright/test';
import { countrySelect, telInput } from './harness';

const SWISS_NUMBER = '+41446681800';

/**
 * A preloaded value has to resolve its own country and render in the input
 * before the user touches anything — the path that runs on a form built from
 * saved data.
 */
test.describe('initialValue', () => {
  for (const useMask of [false, true]) {
    test(`renders the number and its country with useMask=${useMask}`, async ({
      page
    }) => {
      // not gotoHarness: the default country is the one parsed from the value
      await page.goto(
        `/e2e?useMask=${useMask}&initialValue=${encodeURIComponent(SWISS_NUMBER)}`
      );

      await expect(countrySelect(page)).toContainText('+41');
      await expect(telInput(page)).toHaveValue('044 668 18 00');
      await expect(page.getByTestId('value')).toHaveText('+41 44 668 18 00');
      await expect(page.getByTestId('status')).toHaveText('VALID');
    });
  }
});
