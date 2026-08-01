import { expect, Page, test } from '@playwright/test';
import { caretPosition, gotoHarness, telInput, typeDigits } from './harness';

/**
 * Undo, redo and cut are edits the component never issues itself: the browser
 * restores or removes text from its own edit history, and the component only
 * sees the resulting `input` event. The risk is the control value and the
 * displayed text drifting apart — the emitted number still describing text the
 * user has already undone.
 *
 * These are the paths a mask makes hardest, so each case runs both ways.
 */
for (const useMask of [false, true]) {
  test.describe(`undo, redo and cut with useMask=${useMask}`, () => {
    test('keeps the emitted value in step with an undo', async ({ page }) => {
      await gotoHarness(page, { useMask });
      await typeDigits(page, '612345678');
      await expect(page.getByTestId('value')).toHaveText('+34 612 34 56 78');

      await page.keyboard.press('ControlOrMeta+z');

      // whatever the browser restores, the emitted value must describe the
      // text actually in the input — never the number that was undone
      await expect.poll(() => valueMismatch(page)).toBe('');
    });

    test('keeps the emitted value in step with an undo then redo', async ({
      page
    }) => {
      await gotoHarness(page, { useMask });
      await typeDigits(page, '612345678');

      await page.keyboard.press('ControlOrMeta+z');
      await page.keyboard.press('ControlOrMeta+Shift+z');

      await expect.poll(() => valueMismatch(page)).toBe('');
    });

    test('drops the number and the value when the input is cut', async ({
      page
    }) => {
      await gotoHarness(page, { useMask });
      await typeDigits(page, '612345678');
      await expect(page.getByTestId('status')).toHaveText('VALID');

      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.press('ControlOrMeta+x');

      await expect(telInput(page)).toHaveValue('');
      await expect(page.getByTestId('value')).toBeEmpty();
      await expect(page.getByTestId('status')).toHaveText('INVALID');
    });

    test('re-emits the number when the cut text is pasted back', async ({
      page
    }) => {
      await gotoHarness(page, { useMask });
      await page
        .context()
        .grantPermissions(['clipboard-read', 'clipboard-write']);
      await typeDigits(page, '612345678');

      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.press('ControlOrMeta+x');
      await expect(telInput(page)).toHaveValue('');
      await page.keyboard.press('ControlOrMeta+v');

      await expect(telInput(page)).toHaveValue('612 34 56 78');
      await expect(page.getByTestId('value')).toHaveText('+34 612 34 56 78');
      await expect(page.getByTestId('status')).toHaveText('VALID');
    });

    test('leaves the caret inside the value after cutting a selection', async ({
      page
    }) => {
      await gotoHarness(page, { useMask });
      await typeDigits(page, '612345678');

      // cut the last two characters
      const before = await telInput(page).inputValue();
      await telInput(page).evaluate(
        (el: HTMLInputElement, length: number) =>
          el.setSelectionRange(length - 2, length),
        before.length
      );
      await page.keyboard.press('ControlOrMeta+x');

      const after = await telInput(page).inputValue();
      await expect
        .poll(() => caretPosition(page))
        .toBeLessThanOrEqual(after.length);
      await expect.poll(() => caretPosition(page)).toBeGreaterThanOrEqual(0);
    });
  });
}

/** The digits of a formatted number, so display and output can be compared. */
function digitsOf(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Empty when the emitted number describes the text currently in the input,
 * otherwise a description of the drift. Returned as a string rather than a
 * boolean so a timeout names both sides.
 *
 * Polled, never read directly: the component reformats and restores the caret
 * inside a `setTimeout`, so a read right after the keystroke can catch the
 * input updated and the output not yet — a transient, not a defect.
 */
async function valueMismatch(page: Page): Promise<string> {
  const displayed = await telInput(page).inputValue();
  const emitted = await page.getByTestId('value').innerText();
  return digitsOf(emitted) === `34${digitsOf(displayed)}`
    ? ''
    : `input "${displayed}" but emitted "${emitted}"`;
}
