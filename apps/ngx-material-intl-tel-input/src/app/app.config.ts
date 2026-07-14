import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
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
    provideRouter(appRoutes),
    { provide: LOCALE_ID, useValue: 'es-ES' },
    {
      provide: COUNTRY_NAME_OVERRIDES,
      useValue: spanishCountryOverrides
    }
  ]
};
