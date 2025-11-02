import { inject, Injectable, InjectionToken, LOCALE_ID } from '@angular/core';

/**
 * Optional map of ISO country codes to user-defined display names.
 */
export type CountryNameOverrides = Partial<Record<string, string>>;

/**
 * Injection token that allows library consumers to override country display names.
 */
export const COUNTRY_NAME_OVERRIDES = new InjectionToken<CountryNameOverrides>(
  'COUNTRY_NAME_OVERRIDES'
);

/**
 * Provides localized country names using the browser `Intl.DisplayNames` API,
 * while honoring optional overrides supplied by host applications.
 */
@Injectable({
  providedIn: 'root'
})
export class CountryDisplayNameService {
  private readonly overrides = inject(COUNTRY_NAME_OVERRIDES, {
    optional: true
  });
  private currentLocale: string;
  private displayNames?: Intl.DisplayNames;

  constructor() {
    const locale = inject(LOCALE_ID);
    this.currentLocale = locale;
    this.displayNames = this.createDisplayNames(locale);
  }

  /**
   * Allows host applications to switch locales at runtime.
   *
   * @param locale - Locale identifier (e.g. `es-ES`). Falsy values are ignored.
   */
  setLocale(locale: string): void {
    if (!locale || locale === this.currentLocale) {
      return;
    }
    this.currentLocale = locale;
    this.displayNames = this.createDisplayNames(locale);
  }

  /**
   * Resolves a localized country name for the provided ISO code.
   *
   * @param isoCode - ISO 3166-1 alpha-2 country code.
   * @param fallback - Fallback country name.
   * @returns Localized country name if available, otherwise the fallback.
   */
  getCountryName(isoCode: string, fallback: string): string {
    const override = this.getOverride(isoCode);
    if (override) {
      return override;
    }

    const normalizedIso = isoCode?.toUpperCase?.();
    if (normalizedIso && this.displayNames) {
      const localizedName = this.displayNames.of(normalizedIso);
      if (localizedName && localizedName !== normalizedIso) {
        return localizedName;
      }
    }

    return fallback;
  }

  /**
   * Creates an `Intl.DisplayNames` instance for the provided locale.
   * Returns `undefined` if the API is unavailable or throws.
   */
  private createDisplayNames(locale: string): Intl.DisplayNames | undefined {
    if (
      typeof Intl !== 'undefined' &&
      typeof Intl.DisplayNames !== 'undefined'
    ) {
      try {
        return new Intl.DisplayNames([locale], { type: 'region' });
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  /**
   * Attempts to resolve an override using multiple ISO code permutations.
   */
  private getOverride(isoCode: string): string | undefined {
    if (!this.overrides) {
      return undefined;
    }

    const potentialKeys = [
      isoCode,
      isoCode?.toUpperCase?.(),
      isoCode?.toLowerCase?.()
    ].filter(Boolean) as string[];

    for (const key of potentialKeys) {
      const value = this.overrides[key];
      if (value) {
        return value;
      }
    }

    return undefined;
  }
}
