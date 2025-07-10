import {
  ApplicationConfig,
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

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideAnimations(),
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
    provideZonelessChangeDetection()
  ]
};
