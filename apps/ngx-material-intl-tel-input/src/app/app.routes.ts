import { Route } from '@angular/router';
import { HomeComponent } from './home/home.component';

export const appRoutes: Route[] = [
  { path: '', component: HomeComponent },
  {
    // e2e-only harness: renders a single component instance configured from
    // query params. Lazy so it stays out of the public demo bundle.
    path: 'e2e',
    loadComponent: () =>
      import('./e2e-harness/e2e-harness.component').then(
        (m) => m.E2eHarnessComponent
      )
  }
];
