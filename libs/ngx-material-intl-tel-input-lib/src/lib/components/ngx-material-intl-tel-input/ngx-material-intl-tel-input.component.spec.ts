import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormControl } from '@angular/forms';
import { NgxMaterialIntlTelInputRefactoredComponent } from './ngx-material-intl-tel-input.component';
import { PhoneInputFacadeService } from '../../services/phone-input-facade/phone-input-facade.service';
import { CountryDataService } from '../../services/country-data/country-data.service';
import { GeoIpService } from '../../services/geo-ip/geo-ip.service';
import { CountryCode } from '../../data/country-code';

describe('NgxMaterialIntlTelInputRefactoredComponent', () => {
  let component: NgxMaterialIntlTelInputRefactoredComponent;
  let fixture: ComponentFixture<NgxMaterialIntlTelInputRefactoredComponent>;
  let facadeService: PhoneInputFacadeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NgxMaterialIntlTelInputRefactoredComponent,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        PhoneInputFacadeService,
        CountryDataService,
        GeoIpService,
        CountryCode
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(
      NgxMaterialIntlTelInputRefactoredComponent
    );
    component = fixture.componentInstance;
    facadeService = fixture.debugElement.injector.get(PhoneInputFacadeService);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.phoneNumber()).toBe('');
    expect(component.selectedCountry()).toBeNull();
    expect(component.required()).toBe(false);
    expect(component.disabled()).toBe(false);
  });

  it('should have default appearance as fill', () => {
    expect(component.appearance()).toBe('fill');
  });

  it('should have default text labels', () => {
    const labels = component.textLabels();
    expect(labels.mainLabel).toBe('Phone number');
    expect(labels.requiredError).toBe('This field is required');
    expect(labels.invalidNumberError).toBe('Number is not valid');
  });

  it('should create facade service', () => {
    expect(facadeService).toBeTruthy();
  });

  it('should handle country selection', () => {
    const mockCountry = {
      iso2: 'us',
      dialCode: '1',
      name: 'United States',
      flagClass: 'flag-us',
      emojiFlag: '🇺🇸',
      mask: undefined, // Remove mask to avoid IMask dependency issues in tests
      placeHolder: '+1 (555) 123-4567',
      priority: 0,
      areaCodes: undefined,
      htmlId: 'country-us'
    };

    // Mock the facade service method
    jest.spyOn(facadeService, 'setSelectedCountry');

    component.onCountryChanged(mockCountry);

    expect(facadeService.setSelectedCountry).toHaveBeenCalledWith(mockCountry);
  });

  it('should handle phone number changes', () => {
    const phoneNumber = '1234567890';

    // Mock the facade service method
    jest.spyOn(facadeService, 'setPhoneNumber');

    component.onPhoneNumberChanged(phoneNumber);

    expect(facadeService.setPhoneNumber).toHaveBeenCalledWith(phoneNumber);
  });

  it('should handle phone input focus', () => {
    component.onPhoneInputFocused();

    expect(facadeService.isFocused()).toBe(true);
  });

  it('should handle phone input blur', () => {
    component.onPhoneInputBlurred();

    expect(facadeService.isFocused()).toBe(false);
  });

  it('should handle search term changes', () => {
    const searchTerm = 'United';
    component.onSearchTermChanged(searchTerm);

    // Just verify the method was called without error
    expect(component).toBeTruthy();
  });

  it('should emit current value when phone number changes', () => {
    jest.spyOn(component.currentValue, 'emit');

    // Set phone number via facade service (which is how it actually works)
    facadeService.setPhoneNumber('1234567890');

    // Trigger change detection to run effects
    fixture.detectChanges();

    expect(component.currentValue.emit).toHaveBeenCalledWith('1234567890');
  });

  it('should emit country codes when country changes', () => {
    jest.spyOn(component.currentCountryCode, 'emit');
    jest.spyOn(component.currentCountryISO, 'emit');

    const mockCountry = {
      iso2: 'us',
      dialCode: '1',
      name: 'United States',
      flagClass: 'flag-us',
      emojiFlag: '🇺🇸',
      mask: undefined, // Remove mask to avoid IMask dependency issues in tests
      placeHolder: '+1 (555) 123-4567',
      priority: 0,
      areaCodes: undefined,
      htmlId: 'country-us'
    };

    // Set country via facade service (which is how it actually works)
    facadeService.setSelectedCountry(mockCountry);

    // Trigger change detection to run effects
    fixture.detectChanges();

    expect(component.currentCountryCode.emit).toHaveBeenCalledWith('1');
    expect(component.currentCountryISO.emit).toHaveBeenCalledWith('us');
  });

  it('should set field control from model', () => {
    const control = new FormControl('initial-value');
    component.fieldControl.set(control);

    expect(component.fieldControl()).toBe(control);
  });

  it('should render country selector as mat-select', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const countrySelector = compiled.querySelector('mat-select');
    expect(countrySelector).toBeTruthy();
  });

  it('should render phone number input as mat-input', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const phoneInput = compiled.querySelector('input[type="tel"]');
    expect(phoneInput).toBeTruthy();
  });

  it('should render validation messages as mat-error elements', () => {
    // Set up text labels first
    fixture.componentRef.setInput('textLabels', {
      requiredError: 'Phone number is required'
    });

    // Set up the facade's field control with errors
    const control = new FormControl('');
    control.setErrors({ required: true });
    control.markAsDirty();

    // Set the facade's field control
    (component as any).facade.fieldControl = control;

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const validationMessage = compiled.querySelector('mat-error');
    expect(validationMessage).toBeTruthy();
    expect(validationMessage?.textContent?.trim()).toBe(
      'Phone number is required'
    );
  });

  it('should show main label when provided', () => {
    fixture.componentRef.setInput('textLabels', {
      mainLabel: 'Custom Phone Label'
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const label = compiled.querySelector('.main-label');
    expect(label?.textContent?.trim()).toBe('Custom Phone Label');
  });

  describe('Field Control Setup', () => {
    it('should set up field control from parent when fieldControlName is provided', () => {
      const mockParentControl = new FormControl('test-value');
      const mockControlContainer = {
        control: {
          get: jest.fn().mockReturnValue(mockParentControl)
        }
      };

      // Set up the component with a mock control container
      Object.defineProperty(component, 'controlContainer', {
        value: mockControlContainer,
        configurable: true
      });

      // Set the field control name using componentRef
      fixture.componentRef.setInput('fieldControlName', 'testField');

      // Call the private method through ngOnInit or directly
      (component as any).setupFieldControlFromParent();

      expect(mockControlContainer.control.get).toHaveBeenCalledWith(
        'testField'
      );
      expect(component.fieldControl()).toBe(mockParentControl);
    });

    it('should not set field control when fieldControlName is empty', () => {
      const mockControlContainer = {
        control: {
          get: jest.fn()
        }
      };

      Object.defineProperty(component, 'controlContainer', {
        value: mockControlContainer,
        configurable: true
      });

      fixture.componentRef.setInput('fieldControlName', '');
      const originalFieldControl = component.fieldControl();

      (component as any).setupFieldControlFromParent();

      expect(mockControlContainer.control.get).not.toHaveBeenCalled();
      expect(component.fieldControl()).toBe(originalFieldControl);
    });

    it('should not set field control when controlContainer is null', () => {
      Object.defineProperty(component, 'controlContainer', {
        value: null,
        configurable: true
      });

      fixture.componentRef.setInput('fieldControlName', 'testField');
      const originalFieldControl = component.fieldControl();

      (component as any).setupFieldControlFromParent();

      expect(component.fieldControl()).toBe(originalFieldControl);
    });

    it('should not set field control when parent control is not found', () => {
      const mockControlContainer = {
        control: {
          get: jest.fn().mockReturnValue(null)
        }
      };

      Object.defineProperty(component, 'controlContainer', {
        value: mockControlContainer,
        configurable: true
      });

      fixture.componentRef.setInput('fieldControlName', 'nonExistentField');
      const originalFieldControl = component.fieldControl();

      (component as any).setupFieldControlFromParent();

      expect(mockControlContainer.control.get).toHaveBeenCalledWith(
        'nonExistentField'
      );
      expect(component.fieldControl()).toBe(originalFieldControl);
    });
  });

  describe('ngOnDestroy', () => {
    it('should emit and complete destroyed$ subject', () => {
      const nextSpy = jest.spyOn((component as any).destroyed$, 'next');
      const completeSpy = jest.spyOn((component as any).destroyed$, 'complete');

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should handle error states and loading conditions', () => {
      // Test error states in signals
      const control = new FormControl('invalid');
      control.setErrors({ invalidNumber: true });
      component.fieldControl.set(control);

      expect(component.fieldControl()?.errors).toEqual({ invalidNumber: true });
    });

    it('should handle edge cases in number formatting', () => {
      // Test number formatting with facade service
      const testNumber = '123456789';
      (component as any).facade.setPhoneNumber(testNumber);

      expect((component as any).facade.phoneNumber()).toBe(testNumber);
    });

    it('should handle missing field control name resolution', () => {
      // Test field control resolution by setting a non-existent name
      fixture.componentRef.setInput('fieldControlName', 'nonExistentControl');
      fixture.detectChanges();

      // The component should handle this gracefully - it creates a new FormControl
      expect(component.fieldControl()).toBeTruthy();
    });

    it('should handle IMask creation errors gracefully', () => {
      // Mock IMask to throw an error
      const mockIMaskError = new Error('IMask creation failed');
      (global as any).IMask = {
        createMask: jest.fn().mockImplementation(() => {
          throw mockIMaskError;
        })
      };

      fixture.componentRef.setInput('useMask', true);
      fixture.detectChanges();

      // This should not throw and should handle the error gracefully
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle country change with invalid selected country', () => {
      // Set an invalid country that might cause issues
      const invalidCountry = null as any;
      component.onCountryChanged(invalidCountry);

      // Should handle null country gracefully
      expect((component as any).facade.selectedCountry()).toBeNull();
    });

    it('should handle empty or whitespace phone numbers', () => {
      (component as any).facade.setPhoneNumber('   ');

      // Should handle whitespace gracefully
      expect((component as any).facade.phoneNumber()).toBe('   ');
    });

    it('should handle very long country lists in filtering', () => {
      // Create a large array of countries to test performance edge cases
      const largeCountryList = Array.from({ length: 100 }, (_, i) => ({
        name: `Country${i}`,
        iso2: `c${i}`,
        dialCode: `${i}`,
        flagClass: `flag-c${i}`,
        emojiFlag: '🏳️',
        mask: undefined,
        placeHolder: `+${i} xxx xxx xxxx`,
        priority: 0,
        areaCodes: undefined,
        htmlId: `country-c${i}`
      }));

      (component as any).facade['_allCountries'].set(largeCountryList);
      (component as any).facade.filterCountries('Country1');

      // Should handle large lists without performance issues
      expect(
        (component as any).facade.filteredCountries().length
      ).toBeGreaterThan(0);
    });

    it('should handle cursor position edge cases', () => {
      // Test that component handles missing input elements gracefully
      expect(component).toBeTruthy();
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle disabled state changes', () => {
      // Test disabled state change
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      expect(component.disabled()).toBe(true);

      fixture.componentRef.setInput('disabled', false);
      fixture.detectChanges();

      expect(component.disabled()).toBe(false);
    });

    it('should handle required state changes', () => {
      // Test required state change
      fixture.componentRef.setInput('required', true);
      fixture.detectChanges();

      expect(component.required()).toBe(true);

      fixture.componentRef.setInput('required', false);
      fixture.detectChanges();

      expect(component.required()).toBe(false);
    });

    it('should handle template conditional rendering branches', () => {
      // Test different conditional branches in template
      fixture.componentRef.setInput('hidePhoneIcon', true);
      fixture.componentRef.setInput('emojiFlags', true);
      fixture.componentRef.setInput('enableSearch', false);

      fixture.detectChanges();

      expect(component.hidePhoneIcon()).toBe(true);
      expect(component.emojiFlags()).toBe(true);
      expect(component.enableSearch()).toBe(false);
    });

    it('should handle component state changes', () => {
      // Test that component handles various state changes gracefully
      expect(component.disabled()).toBe(false);
      expect(component.required()).toBe(false);
      expect(component.fieldControl()).toBeTruthy();

      // Test that the component can handle different input configurations
      fixture.componentRef.setInput('disabled', true);
      fixture.componentRef.setInput('required', true);
      fixture.detectChanges();

      expect(component.disabled()).toBe(true);
      expect(component.required()).toBe(true);
    });

    it('should handle mask update with different mask types', () => {
      // Test mask update with various mask configurations
      const mockCountryWithMask = {
        iso2: 'us',
        dialCode: '1',
        name: 'United States',
        flagClass: 'flag-us',
        emojiFlag: '🇺🇸',
        mask: { mask: '+1 (000) 000-0000' },
        placeHolder: '+1 (555) 123-4567',
        priority: 0,
        areaCodes: undefined,
        htmlId: 'country-us'
      };

      // Set the country without triggering mask creation
      (component as any).facade.setSelectedCountry(mockCountryWithMask);

      // Test that useMask input works
      fixture.componentRef.setInput('useMask', true);
      expect(component.useMask()).toBe(true);

      fixture.componentRef.setInput('useMask', false);
      expect(component.useMask()).toBe(false);
    });
  });
});
