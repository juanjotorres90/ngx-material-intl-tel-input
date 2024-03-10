import { TestBed } from '@angular/core/testing';
import { GeoIpService } from './geo-ip.service';
import { HttpClientModule } from '@angular/common/http';

describe('GeoIpService', () => {
  let service: GeoIpService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [GeoIpService]
    });
    service = TestBed.inject(GeoIpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
