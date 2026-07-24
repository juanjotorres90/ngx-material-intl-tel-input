import { expect, test } from '@playwright/test';
import { gotoHarness, telInput } from './harness';

const LONG_LABEL = 'International phone number with a long label';

/**
 * With `appearance="outline"` and a main label, the label renders inside the
 * country selector's notched outline. It used to overflow the field and get
 * struck through by the number field's border; the selector now grows to fit,
 * and focus state is mirrored across both fused fields.
 */
test.describe('outline appearance with a main label', () => {
  test('grows the country selector to fit the label', async ({ page }) => {
    await gotoHarness(page, { appearance: 'outline', mainLabel: LONG_LABEL });

    const label = page.locator('.prefix-form-field mat-label').first();
    await expect(label).toHaveText(LONG_LABEL);

    // the label must not be clipped by its own box…
    const clipped = await label.evaluate(
      (el) => el.scrollWidth > el.clientWidth + 1
    );
    expect(clipped, 'main label is truncated inside the notch').toBe(false);

    // …nor overflow the country field it is notched into
    const labelBox = await label.boundingBox();
    const fieldBox = await page.locator('.prefix-form-field').boundingBox();
    expect(labelBox && fieldBox).toBeTruthy();
    expect(labelBox!.x + labelBox!.width).toBeLessThanOrEqual(
      fieldBox!.x + fieldBox!.width + 1
    );
  });

  test('mirrors the focus outline onto the country selector', async ({
    page
  }) => {
    await gotoHarness(page, { appearance: 'outline', mainLabel: LONG_LABEL });

    const leading = page.locator(
      '.prefix-form-field .mdc-notched-outline__leading'
    );
    const restingWidth = await leading.evaluate(
      (el) => getComputedStyle(el).borderTopWidth
    );

    await telInput(page).click();

    await expect
      .poll(() => leading.evaluate((el) => getComputedStyle(el).borderTopWidth))
      .toBe('2px');
    expect(restingWidth).not.toBe('2px');
  });
});
