import { Schema, schema, validate } from '@angular/forms/signals';
import { PhoneNumberUtil } from 'google-libphonenumber';
import { isValidPhoneNumberLength } from '../utils/phone-number.utils';

export type TelephoneValidationErrorKind = 'invalidNumber' | 'numberTooLong';

export interface TelephoneNumberSchemaOptions {
  readonly messages?: Partial<Record<TelephoneValidationErrorKind, string>>;
}

export interface TelephoneNumberAnalysis {
  readonly countryIso?: string;
  readonly error?: TelephoneValidationErrorKind;
}

/**
 * Analyzes a telephone number without mutating form or component state.
 *
 * @param value Telephone number to analyze.
 * @param countryIso Optional ISO2 country hint for national numbers.
 * @returns The inferred country and validation error, when present.
 */
export function analyzeTelephoneNumber(
  value: string,
  countryIso?: string
): TelephoneNumberAnalysis {
  if (!value) {
    return {};
  }

  try {
    const phoneNumberUtil = PhoneNumberUtil.getInstance();
    const parsed = phoneNumberUtil.parse(value, countryIso?.toUpperCase());
    const inferredCountryIso =
      countryIso || phoneNumberUtil.getRegionCodeForNumber(parsed);

    if (!phoneNumberUtil.isValidNumber(parsed)) {
      return {
        countryIso: inferredCountryIso,
        error: 'invalidNumber'
      };
    }

    if (
      inferredCountryIso &&
      !isValidPhoneNumberLength(value, inferredCountryIso)
    ) {
      return {
        countryIso: inferredCountryIso,
        error: 'numberTooLong'
      };
    }

    return { countryIso: inferredCountryIso };
  } catch {
    return { error: 'invalidNumber' };
  }
}

/**
 * Creates a reusable Signal Forms schema for telephone-number validation.
 * Empty values remain valid so consumers can compose Angular's required rule.
 *
 * @param options Optional messages keyed by validation error kind.
 * @returns A Signal Forms schema for a string telephone field.
 */
export function telephoneNumberSchema(
  options: TelephoneNumberSchemaOptions = {}
): Schema<string> {
  return schema<string>((path) => {
    validate(path, ({ value }) => {
      const result = analyzeTelephoneNumber(value());
      if (!result.error) {
        return undefined;
      }

      const message = options.messages?.[result.error];
      return message ? { kind: result.error, message } : { kind: result.error };
    });
  });
}
