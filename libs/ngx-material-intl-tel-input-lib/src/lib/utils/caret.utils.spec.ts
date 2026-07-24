import { adjustCursorPosition, countSpacesBeforePosition } from './caret.utils';

describe('adjustCursorPosition', () => {
  it('should return new value length when original position is at end', () => {
    const result = adjustCursorPosition(5, '12345', '123 456 789');
    expect(result).toBe(11);
  });

  it('should adjust cursor position based on space count difference', () => {
    const result = adjustCursorPosition(3, '123456', '123 456');
    expect(result).toBe(3); // Position 3 in '123456' maps to position 3 in '123 456' (before the space)
  });

  it('should ensure cursor position is within bounds', () => {
    const result = adjustCursorPosition(-5, '123', '123456');
    expect(result).toBe(0);
  });

  it('should not exceed new value length', () => {
    const result = adjustCursorPosition(10, '123456789', '123');
    expect(result).toBe(3);
  });
});

describe('countSpacesBeforePosition', () => {
  it('should count spaces before position', () => {
    const result = countSpacesBeforePosition('12 34 56', 5);
    expect(result).toBe(1); // Only one space before position 5 ('12 34')
  });

  it('should return 0 when no spaces', () => {
    const result = countSpacesBeforePosition('123456', 3);
    expect(result).toBe(0);
  });

  it('should handle position at start', () => {
    const result = countSpacesBeforePosition(' 123', 0);
    expect(result).toBe(0);
  });
});
