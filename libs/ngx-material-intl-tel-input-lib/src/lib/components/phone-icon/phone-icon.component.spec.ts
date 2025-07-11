import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PhoneIconComponent } from './phone-icon.component';

describe('PhoneIconComponent', () => {
  let component: PhoneIconComponent;
  let fixture: ComponentFixture<PhoneIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhoneIconComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PhoneIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the phone icon SVG', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const svg = compiled.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('class')).toContain('icon-tabler-phone');
  });

  it('should have correct SVG attributes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const svg = compiled.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('24');
    expect(svg?.getAttribute('height')).toBe('24');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg?.getAttribute('stroke')).toBe('currentColor');
    expect(svg?.getAttribute('fill')).toBe('none');
  });

  it('should contain the correct path elements', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const paths = compiled.querySelectorAll('path');
    expect(paths.length).toBe(2);

    // Check if the main phone icon path exists
    const mainPath = Array.from(paths).find((path) =>
      path
        .getAttribute('d')
        ?.includes(
          'M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2'
        )
    );
    expect(mainPath).toBeTruthy();
  });
});
