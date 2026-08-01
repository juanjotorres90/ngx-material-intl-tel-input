import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { appRoutes } from './app.routes';
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
    // withComponentInputBinding lets the e2e harness read its configuration
    // straight from query params as component inputs
    provideRouter(appRoutes, withComponentInputBinding()),
    { provide: LOCALE_ID, useValue: 'es-ES' },
    {
      provide: COUNTRY_NAME_OVERRIDES,
      useValue: spanishCountryOverrides
    }
  ]
};
