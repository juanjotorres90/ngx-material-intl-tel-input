import { expect, test } from '@playwright/test';
import {
  caretPosition,
  gotoHarness,
  placeCaret,
  telInput,
  typeDigits
} from './harness';

type ReformatCase = {
  name: string;
  params: NonNullable<Parameters<typeof gotoHarness>[1]>;
  caretBefore: number;
  afterDelete: { value: string; caret: number };
  afterRetype: { digit: string; value: string; caret: number };
};

/**
 * Editing an existing number — inserting in the middle, deleting from the end —
 * is a separate path from appending, and the one 19.2.0 fixed ("cursor position
 * when editing the number from the middle or start position"). The assertions
 * below pin the resulting digits: a caret bug shows up as reordered digits.
 */
test.describe('editing an existing number', () => {
  test('inserts a digit mid-number without reordering, unmasked', async ({
    page
  }) => {
    await gotoHarness(page);
    await typeDigits(page, '612345678');

    await placeCaret(page, 3);
    await telInput(page).pressSequentially('9', { delay: 60 });

    // 612|345678 + 9 -> 6129345678, and the caret stays at the edit point
    await expect(telInput(page)).toHaveValue('6129345678');
    await expect.poll(() => caretPosition(page)).toBe(4);
  });

  test('deletes from the end, unmasked', async ({ page }) => {
    await gotoHarness(page);
    await typeDigits(page, '612345678');
    await expect(telInput(page)).toHaveValue('612 34 56 78');

    await page.keyboard.press('Backspace');

    // the number is no longer valid, so formatting drops away
    await expect(telInput(page)).toHaveValue('61234567');
    await expect.poll(() => caretPosition(page)).toBe(8);
  });

  // This is the case that actually exercises adjustCursorPosition: deleting
  // mid-string drops the number below a valid length (formatting spaces go
  // away) and retyping restores them, so the caret has to be compensated by
  // the space delta in both directions.
  const reformatCases: ReformatCase[] = [
    {
      name: 'unmasked',
      params: {},
      caretBefore: 6,
      afterDelete: { value: '61235678', caret: 4 },
      afterRetype: { digit: '4', value: '612 34 56 78', caret: 6 }
    },
    {
      name: 'with includeDialCode',
      params: { includeDialCode: true },
      caretBefore: 9,
      afterDelete: { value: '+34 61245678', caret: 7 },
      afterRetype: { digit: '3', value: '+34 612 34 56 78', caret: 9 }
    }
  ];

  for (const testCase of reformatCases) {
    test(`compensates the caret for formatting spaces ${testCase.name}`, async ({
      page
    }) => {
      await gotoHarness(page, testCase.params);
      await typeDigits(page, '612345678');

      await placeCaret(page, testCase.caretBefore);
      await page.keyboard.press('Backspace');

      await expect(telInput(page)).toHaveValue(testCase.afterDelete.value);
      await expect
        .poll(() => caretPosition(page))
        .toBe(testCase.afterDelete.caret);

      await telInput(page).pressSequentially(testCase.afterRetype.digit, {
        delay: 60
      });

      await expect(telInput(page)).toHaveValue(testCase.afterRetype.value);
      await expect
        .poll(() => caretPosition(page))
        .toBe(testCase.afterRetype.caret);
    });
  }

  test('inserts a digit mid-number without reordering, masked', async ({
    page
  }) => {
    await gotoHarness(page, { useMask: true });
    await typeDigits(page, '61234567');
    await expect(telInput(page)).toHaveValue('612 34 56 7');

    await placeCaret(page, 3);
    await telInput(page).pressSequentially('9', { delay: 60 });

    await expect(telInput(page)).toHaveValue('612 93 45 67');
    await expect.poll(() => caretPosition(page)).toBe(5);
  });

  test('deletes from the end, masked', async ({ page }) => {
    await gotoHarness(page, { useMask: true });
    await typeDigits(page, '612345678');

    await page.keyboard.press('Backspace');

    await expect(telInput(page)).toHaveValue('612 34 56 7');
    await expect.poll(() => caretPosition(page)).toBe(11);
  });
});
