import { TestBed } from '@angular/core/testing';
import { GeoIpService } from './geo-ip.service';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { GeoData } from '../../types/geo.type';
import { provideHttpClient, withFetch } from '@angular/common/http';

describe('GeoIpService', () => {
  let service: GeoIpService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GeoIpService,
        provideHttpClientTesting(),
        provideHttpClient(withFetch())
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
    const mockGeoData: GeoData = {
      ip: '127.0.0.1',
      network: '127.0.0.0',
      version: 'IPv4',
      city: 'New York',
      region: 'New York',
      region_code: 'NY',
      country: 'United States',
      country_name: 'United States',
      country_code: 'US',
      country_code_iso3: 'USA',
      country_capital: 'Washington',
      country_tld: '.us',
      continent_code: 'NA',
      in_eu: false,
      postal: '10001',
      latitude: 40.7128,
      longitude: -74.006,
      timezone: 'America/New_York',
      utc_offset: '-0500',
      country_calling_code: '1',
      currency: 'USD',
      currency_name: 'US Dollar',
      languages: 'en-US,es-US,haw,fr',
      country_area: 4894947,
      country_population: 310232863,
      asn: 'AS15169',
      org: 'The Tor Project, Inc.'
    };

    service.geoIpLookup().subscribe((data) => {
      expect(data).toEqual(mockGeoData);
      const req = httpMock.expectOne('https://ipapi.co/json');
      expect(req.request.method).toBe('GET');
      req.flush(mockGeoData);
    });
  });
});
