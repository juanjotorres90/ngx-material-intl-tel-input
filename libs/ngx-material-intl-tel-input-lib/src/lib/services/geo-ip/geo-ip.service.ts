import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GeoData } from '../../types/geo.type';

@Injectable()
export class GeoIpService {

  constructor(private http: HttpClient) { }

  geoIpLookup(): Observable<GeoData> {
    return this.http.get<GeoData>('https://ipapi.co/json');
  }
}
