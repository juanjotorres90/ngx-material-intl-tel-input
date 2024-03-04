import { TestBed } from '@angular/core/testing';

import { GeoIpService } from './geo-ip.service';

describe('GeoIpService', () => {
  let service: GeoIpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoIpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
