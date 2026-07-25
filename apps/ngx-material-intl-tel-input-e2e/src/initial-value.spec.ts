import { expect, test } from '@playwright/test';
import { countrySelect, selectCountry, telInput } from './harness';

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

  // with includeDialCode the input keeps the dial code, so the preloaded value
  // must render in the output format rather than the national one
  test('renders the dial code in the input with includeDialCode', async ({
    page
  }) => {
    await page.goto(
      `/e2e?includeDialCode=true&initialValue=${encodeURIComponent(SWISS_NUMBER)}`
    );

    await expect(countrySelect(page)).toContainText('CH');
    await expect(telInput(page)).toHaveValue('+41 44 668 18 00');
    await expect(page.getByTestId('status')).toHaveText('VALID');
  });

  test('renders a preloaded shared-dial-code number under its territory', async ({
    page
  }) => {
    await page.goto(`/e2e?initialValue=${encodeURIComponent('+16702345678')}`);

    // the area code distinguishes MP from the other +1 territories, and the
    // national format keeps it in the number itself
    await expect(countrySelect(page)).toContainText('+1');
    await expect(telInput(page)).toHaveValue('(670) 234-5678');
    await expect(page.getByTestId('value')).toHaveText('+1 670-234-5678');
    await expect(page.getByTestId('status')).toHaveText('VALID');
  });

  // setInitialTelValue falls into its catch branch here: the value goes into
  // the input and the control as-is, and the form still settles rather than
  // staying stuck loading
  test('shows an unparseable initial value as typed', async ({ page }) => {
    await page.goto(`/e2e?initialValue=${encodeURIComponent('not a number')}`);

    await expect(telInput(page)).toHaveValue('not a number');
    await expect(page.getByTestId('status')).toHaveText('INVALID');
    await expect(page.locator('mat-error')).toHaveText('Number is not valid');
  });

  // The stored-national-number case: a value that lost its prefix parses under
  // whatever country is selected, so the component must not guess one — that
  // would silently relabel the record. The selector stays empty and the number
  // is shown as stored.
  test('leaves the selector empty for a value with no country of its own', async ({
    page
  }) => {
    await page.goto(`/e2e?initialValue=675476745`);

    await expect(telInput(page)).toHaveValue('675476745');
    await expect(countrySelect(page)).toContainText('Code');
    await expect(page.getByTestId('status')).toHaveText('INVALID');
  });

  // and the user completes it by choosing the country the record belongs to
  test('resolves a prefixless value once the user picks the country', async ({
    page
  }) => {
    await page.goto(`/e2e?initialValue=675476745`);
    await expect(countrySelect(page)).toContainText('Code');

    await selectCountry(page, 'Spain');

    await expect(countrySelect(page)).toContainText('+34');
    await expect(page.getByTestId('value')).toHaveText('+34 675 47 67 45');
    await expect(page.getByTestId('status')).toHaveText('VALID');
  });

  // an explicitly configured country is the consumer stating the assumption,
  // so it is applied to a value that resolves none of its own
  test('applies autoSelectedCountry to a prefixless value', async ({
    page
  }) => {
    await page.goto(`/e2e?autoSelectedCountry=es&initialValue=675476745`);

    await expect(countrySelect(page)).toContainText('+34');
    await expect(page.getByTestId('value')).toHaveText('+34 675 47 67 45');
    await expect(page.getByTestId('status')).toHaveText('VALID');
  });

  test('ignores autoSelectedCountry when autoSelectCountry is off', async ({
    page
  }) => {
    await page.goto(
      '/e2e?autoSelectCountry=false&autoSelectedCountry=es&initialValue=675476745'
    );

    await expect(telInput(page)).toHaveValue('675476745');
    await expect(countrySelect(page)).toContainText('Code');
  });

  // the same path by a different route: the value parses, but its country was
  // excluded from the list, so nothing resolves. The national format would drop
  // the calling code with no selected country to put it back, so the number
  // keeps it and the stored value survives untouched.
  test('leaves the selector empty when the parsed country is excluded', async ({
    page
  }) => {
    await page.goto(
      `/e2e?excludedCountries=ch&initialValue=${encodeURIComponent(SWISS_NUMBER)}`
    );

    await expect(countrySelect(page)).toContainText('Code');
    await expect(telInput(page)).toHaveValue('+41 44 668 18 00');
    await expect(page.getByTestId('value')).toHaveText('+41 44 668 18 00');
    await expect(page.getByTestId('status')).toHaveText('VALID');
  });

  // and with a fallback country selected, which is where the calling code used
  // to be dropped and the digits re-read as a Spanish number
  test('keeps a preloaded number whose country is excluded under autoSelectedCountry', async ({
    page
  }) => {
    await page.goto(
      `/e2e?excludedCountries=ch&autoSelectedCountry=es&initialValue=${encodeURIComponent(SWISS_NUMBER)}`
    );

    await expect(countrySelect(page)).toContainText('+34');
    await expect(telInput(page)).toHaveValue('+41 44 668 18 00');
    await expect(page.getByTestId('value')).toHaveText('+41 44 668 18 00');
    await expect(page.getByTestId('status')).toHaveText('VALID');
  });

  test('leaves an empty initial value on the default country', async ({
    page
  }) => {
    await page.goto('/e2e?initialValue=');

    await expect(countrySelect(page)).toContainText('+34');
    await expect(telInput(page)).toHaveValue('');
    await expect(page.getByTestId('status')).toHaveText('INVALID');
  });
});
