import {
  ApplicationConfig,
  LOCALE_ID,
  provideZonelessChangeDetection
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi
} from '@angular/common/http';
import {
  COUNTRY_NAME_OVERRIDES,
  CountryNameOverrides
} from 'ngx-material-intl-tel-input';

const spanishCountryOverrides: CountryNameOverrides = {
  US: 'Estados Unidos de América',
  MX: 'Estados Unidos Mexicanos'
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideAnimations(),
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
    provideZonelessChangeDetection(),
    { provide: LOCALE_ID, useValue: 'es-ES' },
    {
      provide: COUNTRY_NAME_OVERRIDES,
      useValue: spanishCountryOverrides
    }
  ]
};
