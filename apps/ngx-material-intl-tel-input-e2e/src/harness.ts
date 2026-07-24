import { expect, Locator, Page } from '@playwright/test';

/**
 * Helpers for the demo app's `/e2e` harness page, which renders a single
 * component instance configured from query params.
 */

export const telInput = (page: Page): Locator =>
  page.locator('input[type="tel"]');

export const countrySelect = (page: Page): Locator =>
  page.locator('mat-select');

/**
 * Opens the harness with the given component inputs as query params and waits
 * for the country selector to settle. Spain (+34) is the library's built-in
 * default when no country is auto-selected, so it is stable across machines.
 */
export async function gotoHarness(
  page: Page,
  params: Record<string, string | boolean> = {}
): Promise<void> {
  const query = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  ).toString();
  await page.goto(`/e2e${query ? `?${query}` : ''}`);
  // the trigger shows the dial code, or the ISO code when the dial code is
  // already rendered inside the number input (includeDialCode)
  await expect(countrySelect(page)).toContainText(/\+34|ES/);
}

/**
 * Types one digit at a time and reports the caret position after each
 * keystroke, so a spec can assert the caret never jumps backwards.
 */
export async function typeDigits(
  page: Page,
  digits: string
): Promise<number[]> {
  const input = telInput(page);
  await input.click();
  const carets: number[] = [];
  for (const digit of digits) {
    await input.pressSequentially(digit, { delay: 40 });
    carets.push(
      await input.evaluate((el: HTMLInputElement) => el.selectionStart ?? -1)
    );
  }
  return carets;
}

/**
 * The regression guard for issue #80: with a mask, every keystroke must leave
 * the caret further right than the previous one.
 */
export function expectCaretNeverGoesBackwards(carets: number[]): void {
  for (let i = 1; i < carets.length; i++) {
    expect(
      carets[i],
      `caret went backwards at keystroke ${i + 1}: ${carets.join(' -> ')}`
    ).toBeGreaterThan(carets[i - 1]);
  }
}

/** Picks a country from the selector by its English name. */
export async function selectCountry(page: Page, name: string): Promise<void> {
  await countrySelect(page).click();
  await page.getByRole('option', { name, exact: false }).first().click();
  await expect(page.locator('.tel-mat-select-panel')).toBeHidden();
}

/** Reports the caret position in the number input. */
export const caretPosition = (page: Page): Promise<number> =>
  telInput(page).evaluate((el: HTMLInputElement) => el.selectionStart ?? -1);

/** Moves the caret inside the number input without changing its value. */
export async function placeCaret(page: Page, index: number): Promise<void> {
  await telInput(page).evaluate(
    (el: HTMLInputElement, at: number) => el.setSelectionRange(at, at),
    index
  );
}

/** Pastes text into the number input through the real clipboard. */
export async function pasteIntoInput(page: Page, text: string): Promise<void> {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await telInput(page).click();
  await page.evaluate((value) => navigator.clipboard.writeText(value), text);
  await page.keyboard.press('ControlOrMeta+V');
}
