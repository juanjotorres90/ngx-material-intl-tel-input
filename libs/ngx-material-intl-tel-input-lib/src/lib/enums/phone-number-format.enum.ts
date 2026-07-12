/**
 * Output formats for the emitted phone number value.
 * Values map directly to libphonenumber-js format identifiers.
 */
export enum PhoneNumberFormat {
  NATIONAL = 'NATIONAL',
  INTERNATIONAL = 'INTERNATIONAL',
  E164 = 'E.164',
  RFC3966 = 'RFC3966'
}

/** @deprecated Numeric values accepted for google-libphonenumber compatibility. */
export type LegacyPhoneNumberFormat = 0 | 1 | 2 | 3;

export type PhoneNumberOutputFormat =
  | PhoneNumberFormat.E164
  | PhoneNumberFormat.INTERNATIONAL
  | PhoneNumberFormat.RFC3966
  | LegacyPhoneNumberFormat;

/** Converts legacy google-libphonenumber enum values to the current format. */
export const normalizePhoneNumberFormat = (
  format: PhoneNumberFormat | LegacyPhoneNumberFormat
): PhoneNumberFormat => {
  switch (format) {
    case 0:
      return PhoneNumberFormat.E164;
    case 1:
      return PhoneNumberFormat.INTERNATIONAL;
    case 2:
      return PhoneNumberFormat.NATIONAL;
    case 3:
      return PhoneNumberFormat.RFC3966;
    default:
      return format;
  }
};
