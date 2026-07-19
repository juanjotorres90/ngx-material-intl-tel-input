import type { FieldContext } from '@angular/forms/signals';
import { validPhoneNumber } from './tel-signal.validators';

const ctx = (value: string) =>
  ({ value: () => value }) as unknown as FieldContext<string>;

describe('validPhoneNumber', () => {
  it('should return null for an empty value', () => {
    expect(validPhoneNumber(ctx(''))).toBeNull();
  });

  it('should return null for a valid international number', () => {
    expect(validPhoneNumber(ctx('+34 612 34 56 78'))).toBeNull();
    expect(validPhoneNumber(ctx('+12025550123'))).toBeNull();
  });

  it('should return an invalidNumber error for an invalid number', () => {
    expect(validPhoneNumber(ctx('+34 123'))).toEqual({
      kind: 'invalidNumber'
    });
  });

  it('should return an invalidNumber error for an unparseable value', () => {
    expect(validPhoneNumber(ctx('not a phone'))).toEqual({
      kind: 'invalidNumber'
    });
  });
});
