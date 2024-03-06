import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GeoData } from '../../types/geo.type';

@Injectable()
export class GeoIpService {
  constructor(private http: HttpClient) {}

  /**
   * geoIpLookup function makes an HTTP GET request to retrieve geographical data based on the client's IP address.
   *
   * @return {Observable<GeoData>} an observable of GeoData containing geographical information
   */
  geoIpLookup(): Observable<GeoData> {
    return this.http.get<GeoData>('https://ipapi.co/json');
  }
}
