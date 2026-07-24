/**
 * Caret arithmetic for the number input.
 *
 * These are pure string calculations: the component owns the input element and
 * decides when to apply them, this file only works out where the caret should
 * end up once the value has been reformatted.
 */

/**
 * Counts the number of spaces in a string before a specified position.
 *
 * @param value - The string to be evaluated.
 * @param position - The position in the string up to which spaces are counted.
 * @returns The number of spaces found before the specified position.
 */
export const countSpacesBeforePosition = (
  value: string,
  position: number
): number => {
  return value
    .slice(0, position)
    .split('')
    .filter((char) => char === ' ').length;
};

/**
 * Adjusts the cursor position in an input field after a value change,
 * accounting for added or removed spaces in the new value.
 *
 * @param originalPosition - The original cursor position before the value change.
 * @param oldValue - The previous value of the input field.
 * @param newValue - The new value of the input field.
 * @returns The adjusted cursor position, ensuring it remains within valid bounds.
 */
export const adjustCursorPosition = (
  originalPosition: number,
  oldValue: string,
  newValue: string
): number => {
  let cursorPosition = originalPosition;
  const spaceCountBefore = countSpacesBeforePosition(
    oldValue,
    originalPosition
  );
  const spaceCountAfter = countSpacesBeforePosition(newValue, cursorPosition);
  // Adjust cursor if spaces are added or removed
  cursorPosition += spaceCountAfter - spaceCountBefore;
  if (originalPosition === oldValue.length) {
    return newValue.length;
  }
  // Ensure cursor position is within valid bounds
  cursorPosition = Math.max(0, Math.min(cursorPosition, newValue.length));
  return cursorPosition;
};

/**
 * Object wrapper so consumers call these as methods, which keeps them spyable
 * in tests (vi.mock is not supported for relative imports under the Angular
 * unit-test builder).
 */
export const caretUtils = {
  countSpacesBeforePosition,
  adjustCursorPosition
};
