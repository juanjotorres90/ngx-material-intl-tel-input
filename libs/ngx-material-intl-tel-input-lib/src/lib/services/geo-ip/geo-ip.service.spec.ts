import { TestBed } from '@angular/core/testing';
import { GEO_IP_CONFIG, GeoIpService } from './geo-ip.service';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { GeoData } from '../../types/geo.type';
import { provideHttpClient, withFetch } from '@angular/common/http';

const mockGeoData = {
  country_code: 'US',
  country_name: 'United States'
} as GeoData;

describe('GeoIpService', () => {
  describe('with HttpClient provided', () => {
    let service: GeoIpService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          GeoIpService,
          provideHttpClient(withFetch()),
          provideHttpClientTesting()
        ]
      });
      service = TestBed.inject(GeoIpService);
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should retrieve geographical data based on IP address', () => {
      let received: GeoData | undefined;
      service.geoIpLookup().subscribe((data) => {
        received = data;
      });

      const req = httpMock.expectOne('https://ipapi.co/json');
      expect(req.request.method).toBe('GET');
      req.flush(mockGeoData);

      expect(received).toEqual(mockGeoData);
    });
  });

  describe('with a custom GEO_IP_CONFIG', () => {
    it('should use the configured endpoint', () => {
      TestBed.configureTestingModule({
        providers: [
          GeoIpService,
          provideHttpClient(withFetch()),
          provideHttpClientTesting(),
          {
            provide: GEO_IP_CONFIG,
            useValue: { url: 'https://geo.example.com/lookup' }
          }
        ]
      });
      const service = TestBed.inject(GeoIpService);
      const httpMock = TestBed.inject(HttpTestingController);

      service.geoIpLookup().subscribe();
      httpMock.expectOne('https://geo.example.com/lookup').flush(mockGeoData);
      httpMock.verify();
    });
  });
});
