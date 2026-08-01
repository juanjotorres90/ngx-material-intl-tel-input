import { expect, test } from '@playwright/test';
import {
  countryOptions,
  countrySearchInput,
  countrySelect,
  gotoHarness,
  openCountryPanel,
  searchCountries,
  telInput
} from './harness';

/**
 * The search box is an `ngx-mat-select-search` inside a sticky `mat-option` in
 * the overlay panel. Filtering, its accent-insensitive matching, the
 * no-results state and the focus handoff back to the number input are overlay
 * behavior that jsdom cannot observe, and they break on Material and
 * ngx-mat-select-search upgrades.
 */
test.describe('country search', () => {
  test('filters the list as the term is typed', async ({ page }) => {
    await gotoHarness(page);

    const options = await searchCountries(page, 'switz');

    await expect(options).toHaveCount(1);
    await expect(options.first()).toContainText('Switzerland');
  });

  // normalizeSearchValue strips diacritics with NFD, so the ASCII spelling has
  // to match the native country name the list actually renders
  test('matches a country name without its diacritics', async ({ page }) => {
    await gotoHarness(page);

    const options = await searchCountries(page, 'espana');

    await expect(options.first()).toContainText('España');
  });

  test('shows the no-results message and recovers when cleared', async ({
    page
  }) => {
    await gotoHarness(page);

    const options = await searchCountries(page, 'zzzzz');

    await expect(options).toHaveCount(0);
    // the class also lands on the option host, so address the message div
    await expect(
      page.locator('div.mat-select-search-no-entries-found')
    ).toHaveText('No countries found');

    // force: the clear button inherits the search option's aria-disabled
    await page.locator('.mat-select-search-clear').click({ force: true });

    await expect(options.first()).toBeVisible();
    await expect(countrySearchInput(page)).toHaveValue('');
  });

  test('selects a filtered country and focuses the number input', async ({
    page
  }) => {
    await gotoHarness(page);

    const options = await searchCountries(page, 'switz');
    await options.first().click();

    await expect(page.locator('.tel-mat-select-panel')).toBeHidden();
    await expect(countrySelect(page)).toContainText('+41');
    // the component focuses the number input after a country change, so the
    // user can keep typing without reaching for the mouse
    await expect(telInput(page)).toBeFocused();
  });

  test('keeps the search term out of the number input', async ({ page }) => {
    await gotoHarness(page);

    await searchCountries(page, 'switz');
    await page.keyboard.press('Escape');

    await expect(telInput(page)).toHaveValue('');
  });

  test('resets the filter when the panel is reopened', async ({ page }) => {
    await gotoHarness(page);

    await searchCountries(page, 'switz');
    await page.keyboard.press('Escape');
    await expect(page.locator('.tel-mat-select-panel')).toBeHidden();

    await openCountryPanel(page);

    await expect(countrySearchInput(page)).toHaveValue('');
    await expect(countryOptions(page).first()).toContainText('Afghanistan');
  });
});
