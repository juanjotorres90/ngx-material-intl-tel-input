import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable, throwError, timeout } from 'rxjs';
import { GeoData } from '../../types/geo.type';

/** Configuration for the IP-based country lookup. */
export type GeoIpConfig = {
  /**
   * Endpoint returning JSON with a `country_code` (ISO2) property.
   * Defaults to https://ipapi.co/json, a third-party, rate-limited service:
   * replace it with your own endpoint for production traffic or to avoid
   * sending user IPs to a third party.
   */
  url: string;
  /** Milliseconds before the lookup is aborted. Defaults to 3000. */
  timeoutMs: number;
};

/** Provide to override the geo-IP lookup endpoint and timeout. */
export const GEO_IP_CONFIG = new InjectionToken<Partial<GeoIpConfig>>(
  'GEO_IP_CONFIG'
);

@Injectable()
export class GeoIpService {
  private readonly http = inject(HttpClient, { optional: true });
  private readonly config: GeoIpConfig = {
    url: 'https://ipapi.co/json',
    timeoutMs: 3000,
    ...inject(GEO_IP_CONFIG, { optional: true })
  };

  /**
   * Makes an HTTP GET request to retrieve geographical data based on the client's IP address.
   * Errors (and lets the component fall back to the default country) when
   * HttpClient is not provided, the endpoint is unreachable, or the timeout elapses.
   *
   * @return {Observable<GeoData>} an observable of GeoData containing geographical information
   */
  geoIpLookup(): Observable<GeoData> {
    if (!this.http) {
      return throwError(
        () =>
          new Error(
            'ngx-material-intl-tel-input: provideHttpClient() is required for autoIpLookup. Falling back to the default country.'
          )
      );
    }
    return this.http
      .get<GeoData>(this.config.url)
      .pipe(timeout(this.config.timeoutMs));
  }
}
