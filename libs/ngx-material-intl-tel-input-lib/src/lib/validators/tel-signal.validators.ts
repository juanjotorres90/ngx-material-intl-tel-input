import type { FieldContext, ValidationError } from '@angular/forms/signals';
import { PhoneNumberUtil } from 'google-libphonenumber';

/**
 * Signal Forms validator for the phone number value emitted by
 * NgxMaterialIntlTelInputComponent (a `+`-prefixed international number).
 * Empty values are considered valid — combine with `required()` if needed.
 *
 * Usage: `validate(path.phone, validPhoneNumber)`
 */
export function validPhoneNumber(
  ctx: FieldContext<string>
): ValidationError.WithoutFieldTree | null {
  const value = ctx.value();
  if (!value) {
    return null;
  }
  try {
    const parsed = PhoneNumberUtil.getInstance().parse(value);
    if (PhoneNumberUtil.getInstance().isValidNumber(parsed)) {
      return null;
    }
  } catch {
    // fall through to the error below
  }
  return { kind: 'invalidNumber' };
}
