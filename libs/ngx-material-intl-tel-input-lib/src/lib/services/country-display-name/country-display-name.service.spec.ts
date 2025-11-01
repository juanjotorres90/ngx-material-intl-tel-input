import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  COUNTRY_NAME_OVERRIDES,
  CountryDisplayNameService,
  CountryNameOverrides
} from './country-display-name.service';

const globalAny = globalThis as any;

describe('CountryDisplayNameService', () => {
  let originalIntl: any;
  let originalDisplayNames: any;

  beforeEach(() => {
    originalIntl = globalAny.Intl;
    originalDisplayNames = originalIntl?.DisplayNames;
  });

  afterEach(() => {
    if (originalIntl) {
      globalAny.Intl = originalIntl;
      if (originalDisplayNames) {
        globalAny.Intl.DisplayNames = originalDisplayNames;
      } else if (globalAny.Intl) {
        delete globalAny.Intl.DisplayNames;
      }
    } else {
      globalAny.Intl = originalIntl;
    }
    jest.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  const initService = (options?: {
    locale?: string;
    overrides?: CountryNameOverrides;
  }): CountryDisplayNameService => {
    const providers: any[] = [
      { provide: LOCALE_ID, useValue: options?.locale ?? 'en-US' },
      CountryDisplayNameService
    ];
    if (options?.overrides) {
      providers.push({
        provide: COUNTRY_NAME_OVERRIDES,
        useValue: options.overrides
      });
    }
    TestBed.configureTestingModule({ providers });
    return TestBed.inject(CountryDisplayNameService);
  };

  it('returns fallback when Intl API is unavailable', () => {
    globalAny.Intl = undefined;

    const service = initService();

    expect(service.getCountryName('us', 'United States')).toBe('United States');
  });

  it('returns fallback when DisplayNames API is unavailable', () => {
    if (!globalAny.Intl) {
      globalAny.Intl = {};
    }
    delete globalAny.Intl.DisplayNames;

    const service = initService();

    expect(service.getCountryName('us', 'United States')).toBe('United States');
  });

  it('returns localized names when Intl.DisplayNames provides them', () => {
    const displayNamesInstance = {
      of: jest.fn().mockReturnValue('Estados Unidos')
    };
    const displayNamesFactory = jest
      .fn()
      .mockReturnValue(displayNamesInstance as unknown as Intl.DisplayNames);

    if (!globalAny.Intl) {
      globalAny.Intl = {};
    }
    globalAny.Intl.DisplayNames = displayNamesFactory;

    const service = initService();
    const result = service.getCountryName('us', 'United States');

    expect(result).toBe('Estados Unidos');
    expect(displayNamesFactory).toHaveBeenCalledWith(['en-US'], {
      type: 'region'
    });
    expect(displayNamesInstance.of).toHaveBeenCalledWith('US');
  });

  it('falls back when DisplayNames returns an ISO code', () => {
    const displayNamesInstance = {
      of: jest.fn().mockReturnValue('US')
    };
    const displayNamesFactory = jest
      .fn()
      .mockReturnValue(displayNamesInstance as unknown as Intl.DisplayNames);

    if (!globalAny.Intl) {
      globalAny.Intl = {};
    }
    globalAny.Intl.DisplayNames = displayNamesFactory;

    const service = initService();
    const result = service.getCountryName('us', 'United States');

    expect(result).toBe('United States');
    expect(displayNamesInstance.of).toHaveBeenCalledWith('US');
  });

  it('prefers overrides regardless of Intl.DisplayNames output', () => {
    const displayNamesInstance = {
      of: jest.fn().mockReturnValue('Estados Unidos')
    };
    const displayNamesFactory = jest
      .fn()
      .mockReturnValue(displayNamesInstance as unknown as Intl.DisplayNames);

    if (!globalAny.Intl) {
      globalAny.Intl = {};
    }
    globalAny.Intl.DisplayNames = displayNamesFactory;

    const service = initService({
      overrides: { US: 'Estados Unidos (Override)' }
    });
    const result = service.getCountryName('us', 'United States');

    expect(result).toBe('Estados Unidos (Override)');
    expect(displayNamesInstance.of).not.toHaveBeenCalled();
  });

  it('falls back to Intl.DisplayNames when override does not match', () => {
    const displayNamesInstance = {
      of: jest.fn().mockReturnValue('France'),
      resolvedOptions: jest.fn()
    };
    const displayNamesFactory = jest
      .fn()
      .mockReturnValue(displayNamesInstance as unknown as Intl.DisplayNames);

    if (!globalAny.Intl) {
      globalAny.Intl = {};
    }
    globalAny.Intl.DisplayNames = displayNamesFactory;

    const service = initService({
      overrides: { US: 'Estados Unidos (Override)' }
    });
    const result = service.getCountryName('fr', 'France Fallback');

    expect(result).toBe('France');
    expect(displayNamesInstance.of).toHaveBeenCalledWith('FR');
  });

  it('ignores locale updates when the new locale is falsy or unchanged', () => {
    const createSpy = jest
      .spyOn(CountryDisplayNameService.prototype as any, 'createDisplayNames')
      .mockReturnValue({
        of: jest.fn().mockReturnValue('Name'),
        resolvedOptions: jest.fn()
      } as unknown as Intl.DisplayNames);

    const service = initService();

    expect(createSpy).toHaveBeenCalledTimes(1);

    service.setLocale('');
    service.setLocale('en-US');

    expect(createSpy).toHaveBeenCalledTimes(1);
    createSpy.mockRestore();
  });

  it('rebuilds display names when the locale changes', () => {
    const createSpy = jest
      .spyOn(CountryDisplayNameService.prototype as any, 'createDisplayNames')
      .mockImplementation((...args: unknown[]) => {
        const locale = args[0] as string;
        return {
          locale,
          of: jest.fn().mockReturnValue(locale),
          resolvedOptions: jest.fn()
        } as unknown as Intl.DisplayNames;
      });

    const service = initService({ locale: 'en-US' });
    expect(createSpy).toHaveBeenCalledWith('en-US');

    createSpy.mockClear();
    service.setLocale('es-ES');

    expect(createSpy).toHaveBeenCalledWith('es-ES');
    expect((service as any).currentLocale).toBe('es-ES');
    expect((service as any).displayNames.locale).toBe('es-ES');

    createSpy.mockRestore();
  });

  it('createDisplayNames returns an Intl.DisplayNames instance when available', () => {
    const service = initService();
    const value = (service as any).createDisplayNames('fr-FR');

    if (originalDisplayNames) {
      expect(value).toBeInstanceOf(originalDisplayNames as any);
    } else {
      expect(value).toBeUndefined();
    }
  });

  it('createDisplayNames gracefully handles constructor errors', () => {
    if (!globalAny.Intl) {
      globalAny.Intl = {};
    }

    const throwingFactory = jest.fn(() => {
      throw new Error('boom');
    });
    globalAny.Intl.DisplayNames = throwingFactory;

    const service = initService();

    expect(throwingFactory).toHaveBeenCalled();
    expect((service as any).displayNames).toBeUndefined();
    expect(service.getCountryName('us', 'United States')).toBe('United States');
  });
});
