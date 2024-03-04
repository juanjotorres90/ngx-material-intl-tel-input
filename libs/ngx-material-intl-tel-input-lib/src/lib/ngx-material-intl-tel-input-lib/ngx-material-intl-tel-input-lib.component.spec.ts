import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxMaterialIntlTelInputLibComponent } from './ngx-material-intl-tel-input-lib.component';

describe('NgxMaterialIntlTelInputLibComponent', () => {
  let component: NgxMaterialIntlTelInputLibComponent;
  let fixture: ComponentFixture<NgxMaterialIntlTelInputLibComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxMaterialIntlTelInputLibComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxMaterialIntlTelInputLibComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
