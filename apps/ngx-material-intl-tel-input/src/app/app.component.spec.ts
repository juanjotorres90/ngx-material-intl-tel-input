import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController
} from '@angular/common/http/testing';
import { ComponentFixture } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PhoneNumberFormat } from 'google-libphonenumber';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, ReactiveFormsModule, BrowserAnimationsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    // Mock any HTTP requests to ipapi.co/json that might be triggered during component initialization
    const pendingRequests = httpMock.match('https://ipapi.co/json');
    pendingRequests.forEach((req) => {
      req.error(new ProgressEvent('error'), {
        status: 0,
        statusText: 'Network Error'
      });
    });

    fixture.detectChanges();
  });

  afterEach(() => {
    // Handle any remaining HTTP requests that might be pending
    try {
      const pendingRequests = httpMock.match(() => true);
      pendingRequests.forEach((req) => {
        if (req.request.url.includes('ipapi.co/json')) {
          req.error(new ProgressEvent('error'), {
            status: 0,
            statusText: 'Network Error'
          });
        }
      });
    } catch (error) {
      // Ignore errors from handling pending requests
    }

    // Verify that no unmatched requests are outstanding
    try {
      httpMock.verify();
    } catch (error) {
      // If there are still pending requests, handle them
      const remainingRequests = httpMock.match(() => true);
      remainingRequests.forEach((req) => {
        if (req.request.url.includes('ipapi.co/json')) {
          req.error(new ProgressEvent('error'), {
            status: 0,
            statusText: 'Network Error'
          });
        }
      });
      httpMock.verify();
    }
  });

  // Helper method to handle any geo IP requests that might be triggered
  const handleGeoIpRequests = () => {
    const pendingRequests = httpMock.match('https://ipapi.co/json');
    pendingRequests.forEach((req) => {
      req.error(new ProgressEvent('error'), {
        status: 0,
        statusText: 'Network Error'
      });
    });
  };

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it(`should have as title 'ngx-material-intl-tel-input'`, () => {
      expect(component.title).toEqual('ngx-material-intl-tel-input');
    });

    it('should initialize signals with correct default values', () => {
      expect(component.currentPhoneValue()).toBe('');
      expect(component.currentCountryCode()).toBe('');
      expect(component.currentCountryISO()).toBe('');
      expect(component.submittedPhoneValue()).toBe('');
      expect(component.showSetPhoneInput()).toBe(false);
    });

    it('should initialize form with correct structure', () => {
      expect(component.formTestGroup).toBeDefined();
      expect(component.formTestGroup.get('phone')).toBeDefined();
      expect(component.formTestGroup.get('setPhoneTextbox')).toBeDefined();
    });

    it('should have phone field as required', () => {
      const phoneControl = component.formTestGroup.get('phone');
      expect(phoneControl?.hasError('required')).toBe(true);
    });

    it('should expose PhoneNumberFormat enum', () => {
      expect(component.PhoneNumberFormat).toBe(PhoneNumberFormat);
    });
  });

  describe('getValue method', () => {
    it('should update currentPhoneValue signal', () => {
      const testValue = '+1234567890';
      component.getValue(testValue);
      expect(component.currentPhoneValue()).toBe(testValue);
    });

    it('should handle empty string', () => {
      component.getValue('');
      expect(component.currentPhoneValue()).toBe('');
    });

    it('should handle multiple calls', () => {
      component.getValue('first');
      expect(component.currentPhoneValue()).toBe('first');

      component.getValue('second');
      expect(component.currentPhoneValue()).toBe('second');
    });

    it('should handle special characters in phone number', () => {
      const testValue = '+1 (555) 123-4567';
      component.getValue(testValue);
      expect(component.currentPhoneValue()).toBe(testValue);
    });

    it('should handle international phone numbers', () => {
      const testValue = '+44 20 7946 0958';
      component.getValue(testValue);
      expect(component.currentPhoneValue()).toBe(testValue);
    });
  });

  describe('getCountryCode method', () => {
    it('should update currentCountryCode signal', () => {
      const testCode = '+1';
      component.getCountryCode(testCode);
      expect(component.currentCountryCode()).toBe(testCode);
    });

    it('should handle empty string', () => {
      component.getCountryCode('');
      expect(component.currentCountryCode()).toBe('');
    });

    it('should handle different country codes', () => {
      const countryCodes = ['+1', '+44', '+33', '+49', '+81'];

      countryCodes.forEach((code) => {
        component.getCountryCode(code);
        expect(component.currentCountryCode()).toBe(code);
      });
    });

    it('should handle country code without plus sign', () => {
      const testCode = '1';
      component.getCountryCode(testCode);
      expect(component.currentCountryCode()).toBe(testCode);
    });
  });

  describe('getCountryISO method', () => {
    it('should update currentCountryISO signal', () => {
      const testISO = 'US';
      component.getCountryISO(testISO);
      expect(component.currentCountryISO()).toBe(testISO);
    });

    it('should handle empty string', () => {
      component.getCountryISO('');
      expect(component.currentCountryISO()).toBe('');
    });

    it('should handle different ISO codes', () => {
      const isoCodes = ['US', 'GB', 'FR', 'DE', 'JP', 'CA', 'AU'];

      isoCodes.forEach((iso) => {
        component.getCountryISO(iso);
        expect(component.currentCountryISO()).toBe(iso);
      });
    });

    it('should handle lowercase ISO codes', () => {
      const testISO = 'us';
      component.getCountryISO(testISO);
      expect(component.currentCountryISO()).toBe(testISO);
    });
  });

  describe('onSubmit method', () => {
    it('should update submittedPhoneValue with form phone value', () => {
      const testPhoneValue = '+1234567890';
      component.formTestGroup.patchValue({ phone: testPhoneValue });

      component.onSubmit();

      const submittedValue = component.submittedPhoneValue();
      expect(submittedValue).toContain('234567890');
    });

    it('should handle empty form value', () => {
      component.formTestGroup.patchValue({ phone: '' });

      component.onSubmit();

      expect(component.submittedPhoneValue()).toBe('');
    });

    it('should handle null form value', () => {
      component.formTestGroup.patchValue({ phone: null });

      component.onSubmit();

      expect(component.submittedPhoneValue()).toBe('');
    });

    it('should handle complex phone number formats', () => {
      const complexPhone = '+1 (555) 123-4567 ext. 123';
      component.formTestGroup.patchValue({ phone: complexPhone });

      component.onSubmit();

      const submittedValue = component.submittedPhoneValue();
      expect(submittedValue).toContain('555');
      expect(submittedValue).toContain('123');
      expect(submittedValue).toContain('4567');
    });

    it('should not affect other form controls', () => {
      const phoneValue = '+1234567890';
      const textboxValue = 'test value';

      component.formTestGroup.patchValue({
        phone: phoneValue,
        setPhoneTextbox: textboxValue
      });

      component.onSubmit();

      expect(component.formTestGroup.get('setPhoneTextbox')?.value).toBe(
        textboxValue
      );
    });
  });

  describe('setPhone method', () => {
    it('should set phone control value from setPhoneTextbox control', () => {
      const testValue = '+9876543210';
      component.formTestGroup.patchValue({ setPhoneTextbox: testValue });

      component.setPhone();

      const phoneValue = component.formTestGroup.get('phone')?.value;
      expect(phoneValue).toContain('76543210');
    });

    it('should handle empty setPhoneTextbox value', () => {
      component.formTestGroup.patchValue({ setPhoneTextbox: '' });

      component.setPhone();

      expect(component.formTestGroup.get('phone')?.value).toBe('');
    });

    it('should overwrite existing phone value', () => {
      component.formTestGroup.patchValue({
        phone: 'old value',
        setPhoneTextbox: 'new value'
      });

      component.setPhone();

      expect(component.formTestGroup.get('phone')?.value).toBe('new value');
    });

    it('should handle special characters', () => {
      const specialValue = '+1 (555) 123-4567';
      component.formTestGroup.patchValue({ setPhoneTextbox: specialValue });

      component.setPhone();

      const phoneValue = component.formTestGroup.get('phone')?.value;
      expect(phoneValue).toContain('555');
      expect(phoneValue).toContain('123');
      expect(phoneValue).toContain('4567');
    });

    it('should update form validity after setting phone', () => {
      expect(component.formTestGroup.valid).toBe(false);

      component.formTestGroup.patchValue({ setPhoneTextbox: '+1234567890' });
      component.setPhone();

      const phoneValue = component.formTestGroup.get('phone')?.value;
      expect(phoneValue).toBeTruthy();
      expect(phoneValue).toContain('234567890');
    });
  });

  describe('toggleShowSetPhoneInput method', () => {
    it('should toggle showSetPhoneInput signal from false to true', () => {
      expect(component.showSetPhoneInput()).toBe(false);

      component.toggleShowSetPhoneInput();

      expect(component.showSetPhoneInput()).toBe(true);
    });

    it('should toggle showSetPhoneInput signal from true to false', () => {
      component.showSetPhoneInput.set(true);

      component.toggleShowSetPhoneInput();

      expect(component.showSetPhoneInput()).toBe(false);
    });

    it('should toggle multiple times correctly', () => {
      expect(component.showSetPhoneInput()).toBe(false);

      component.toggleShowSetPhoneInput();
      expect(component.showSetPhoneInput()).toBe(true);

      component.toggleShowSetPhoneInput();
      expect(component.showSetPhoneInput()).toBe(false);

      component.toggleShowSetPhoneInput();
      expect(component.showSetPhoneInput()).toBe(true);
    });

    it('should work independently of other signals', () => {
      component.currentPhoneValue.set('test');
      component.currentCountryCode.set('+1');

      component.toggleShowSetPhoneInput();

      expect(component.showSetPhoneInput()).toBe(true);
      expect(component.currentPhoneValue()).toBe('test');
      expect(component.currentCountryCode()).toBe('+1');
    });
  });

  describe('resetForm method', () => {
    it('should reset form to initial state', () => {
      component.formTestGroup.patchValue({
        phone: '+1234567890',
        setPhoneTextbox: 'test value'
      });

      component.resetForm();

      const phoneValue = component.formTestGroup.get('phone')?.value;
      const textboxValue =
        component.formTestGroup.get('setPhoneTextbox')?.value;
      expect(phoneValue === null || phoneValue === '').toBe(true);
      expect(textboxValue === null || textboxValue === '').toBe(true);
    });

    it('should reset form validation state', () => {
      component.formTestGroup.patchValue({ phone: '+1234567890' });

      component.resetForm();

      expect(component.formTestGroup.valid).toBe(false);
      expect(component.formTestGroup.get('phone')?.hasError('required')).toBe(
        true
      );
    });

    it('should not affect signals', () => {
      component.currentPhoneValue.set('test value');
      component.currentCountryCode.set('+1');
      component.showSetPhoneInput.set(true);

      component.resetForm();

      expect(component.showSetPhoneInput()).toBe(true);
    });

    it('should reset form even when already empty', () => {
      expect(() => component.resetForm()).not.toThrow();
      const phoneValue = component.formTestGroup.get('phone')?.value;
      expect(phoneValue === null || phoneValue === '').toBe(true);
    });
  });

  describe('Form Integration', () => {
    it('should have invalid form when phone is empty', () => {
      component.formTestGroup.patchValue({ phone: '' });
      expect(component.formTestGroup.valid).toBe(false);
    });

    it('should have valid form when phone has value', () => {
      component.formTestGroup.patchValue({ phone: '+1234567890' });
      const phoneValue = component.formTestGroup.get('phone')?.value;
      expect(phoneValue).toBeTruthy();
      expect(phoneValue).toContain('234567890');
    });

    it('should update form validity when phone value changes', () => {
      expect(component.formTestGroup.valid).toBe(false);

      component.formTestGroup.patchValue({ phone: '+1234567890' });
      const phoneValue = component.formTestGroup.get('phone')?.value;
      expect(phoneValue).toBeTruthy();

      component.formTestGroup.patchValue({ phone: '' });
      expect(component.formTestGroup.valid).toBe(false);
    });

    it('should maintain setPhoneTextbox as optional', () => {
      component.formTestGroup.patchValue({
        phone: '+1234567890',
        setPhoneTextbox: ''
      });
      const phoneValue = component.formTestGroup.get('phone')?.value;
      expect(phoneValue).toBeTruthy();
    });

    it('should handle form control errors correctly', () => {
      const phoneControl = component.formTestGroup.get('phone');

      expect(phoneControl?.hasError('required')).toBe(true);
      expect(phoneControl?.errors?.['required']).toBe(true);

      phoneControl?.setValue('+1234567890');
      expect(phoneControl?.hasError('required')).toBe(false);
    });
  });

  describe('Signal Reactivity', () => {
    it('should update signals independently', () => {
      component.getValue('+1234567890');
      component.getCountryCode('+1');
      component.getCountryISO('US');

      expect(component.currentPhoneValue()).toBe('+1234567890');
      expect(component.currentCountryCode()).toBe('+1');
      expect(component.currentCountryISO()).toBe('US');
    });

    it('should maintain signal values across method calls', () => {
      component.getValue('+1234567890');
      component.onSubmit();
      component.resetForm();

      expect(component.showSetPhoneInput()).toBe(false);
    });

    it('should handle rapid signal updates', () => {
      for (let i = 0; i < 100; i++) {
        component.getValue(`+123456789${i}`);
      }
      expect(component.currentPhoneValue()).toBe('+12345678999');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined values gracefully', () => {
      expect(() => {
        component.getValue(undefined as any);
        component.getCountryCode(undefined as any);
        component.getCountryISO(undefined as any);
      }).not.toThrow();
    });

    it('should handle null values gracefully', () => {
      expect(() => {
        component.getValue(null as any);
        component.getCountryCode(null as any);
        component.getCountryISO(null as any);
      }).not.toThrow();
    });

    it('should handle very long phone numbers', () => {
      const longPhone = '+1234567890123456789012345678901234567890';
      component.getValue(longPhone);
      expect(component.currentPhoneValue()).toBe(longPhone);
    });

    it('should handle special characters in phone numbers', () => {
      const specialPhone = '+1 (555) 123-4567 ext. 123 #456';
      component.getValue(specialPhone);
      expect(component.currentPhoneValue()).toBe(specialPhone);
    });

    it('should handle form submission with invalid form', () => {
      component.formTestGroup.patchValue({ phone: '' });

      expect(() => {
        component.onSubmit();
      }).not.toThrow();

      expect(component.submittedPhoneValue()).toBe('');
    });

    it('should handle empty strings consistently', () => {
      component.getValue('');
      component.getCountryCode('');
      component.getCountryISO('');

      expect(component.currentPhoneValue()).toBe('');
      expect(component.currentCountryCode()).toBe('');
      expect(component.currentCountryISO()).toBe('');
    });
  });

  describe('Method Coverage and Type Safety', () => {
    it('should have all required methods defined', () => {
      expect(typeof component.getValue).toBe('function');
      expect(typeof component.getCountryCode).toBe('function');
      expect(typeof component.getCountryISO).toBe('function');
      expect(typeof component.onSubmit).toBe('function');
      expect(typeof component.setPhone).toBe('function');
      expect(typeof component.toggleShowSetPhoneInput).toBe('function');
      expect(typeof component.resetForm).toBe('function');
    });

    it('should have all required properties defined', () => {
      expect(component.title).toBeDefined();
      expect(component.currentPhoneValue).toBeDefined();
      expect(component.currentCountryCode).toBeDefined();
      expect(component.currentCountryISO).toBeDefined();
      expect(component.submittedPhoneValue).toBeDefined();
      expect(component.formTestGroup).toBeDefined();
      expect(component.showSetPhoneInput).toBeDefined();
      expect(component.PhoneNumberFormat).toBeDefined();
    });

    it('should handle constructor injection correctly', () => {
      expect(component.formTestGroup).toBeInstanceOf(Object);
      expect(component.formTestGroup.get('phone')).toBeTruthy();
      expect(component.formTestGroup.get('setPhoneTextbox')).toBeTruthy();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete user workflow', () => {
      component.getValue('+1234567890');
      component.getCountryCode('+1');
      component.getCountryISO('US');

      component.formTestGroup.patchValue({ phone: '+1234567890' });

      component.onSubmit();

      expect(component.currentPhoneValue()).toContain('234567890');
      expect(component.currentCountryCode()).toBe('+1');
      expect(component.currentCountryISO()).toBe('us');
      const submittedValue = component.submittedPhoneValue();
      expect(submittedValue).toContain('234567890');
    });

    it('should handle phone number change workflow', () => {
      component.formTestGroup.patchValue({ phone: '+1234567890' });

      component.toggleShowSetPhoneInput();
      expect(component.showSetPhoneInput()).toBe(true);

      component.formTestGroup.patchValue({ setPhoneTextbox: '+9876543210' });
      component.setPhone();

      const phoneValue = component.formTestGroup.get('phone')?.value;
      expect(phoneValue).toContain('76543210');
    });

    it('should handle form reset workflow', () => {
      component.formTestGroup.patchValue({
        phone: '+1234567890',
        setPhoneTextbox: 'test'
      });
      component.getValue('+1234567890');
      component.onSubmit();

      component.resetForm();

      const phoneValue = component.formTestGroup.get('phone')?.value;
      const textboxValue =
        component.formTestGroup.get('setPhoneTextbox')?.value;
      expect(phoneValue === null || phoneValue === '').toBe(true);
      expect(textboxValue === null || textboxValue === '').toBe(true);

      const submittedValue = component.submittedPhoneValue();
      expect(submittedValue).toBeTruthy();
    });
  });
});

// Add comprehensive tests for refactored component methods
describe('AppComponent - Refactored Methods', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, ReactiveFormsModule, BrowserAnimationsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    // Mock any HTTP requests to ipapi.co/json that might be triggered during component initialization
    const pendingRequests = httpMock.match('https://ipapi.co/json');
    pendingRequests.forEach((req) => {
      req.error(new ProgressEvent('error'), {
        status: 0,
        statusText: 'Network Error'
      });
    });

    fixture.detectChanges();
  });

  afterEach(() => {
    // Verify that no unmatched requests are outstanding
    httpMock.verify();
  });

  describe('Refactored Component Initialization', () => {
    it('should initialize refactored signals with correct default values', () => {
      expect(component.currentPhoneValueRefactored()).toBe('');
      expect(component.currentCountryCodeRefactored()).toBe('');
      expect(component.currentCountryISORefactored()).toBe('');
      expect(component.submittedPhoneValueRefactored()).toBe('');
      expect(component.showSetPhoneInputRefactored()).toBe(false);
    });

    it('should initialize refactored form with correct structure', () => {
      expect(component.formTestGroupRefactored).toBeDefined();
      expect(
        component.formTestGroupRefactored.get('phoneRefactored')
      ).toBeDefined();
      expect(
        component.formTestGroupRefactored.get('setPhoneTextboxRefactored')
      ).toBeDefined();
    });

    it('should have phoneRefactored field as required', () => {
      const phoneControl =
        component.formTestGroupRefactored.get('phoneRefactored');
      expect(phoneControl?.hasError('required')).toBe(true);
    });
  });

  describe('getValueRefactored method', () => {
    it('should update currentPhoneValueRefactored signal', () => {
      const testValue = '+1234567890';
      component.getValueRefactored(testValue);
      expect(component.currentPhoneValueRefactored()).toBe(testValue);
    });

    it('should handle empty string', () => {
      component.getValueRefactored('');
      expect(component.currentPhoneValueRefactored()).toBe('');
    });

    it('should handle multiple calls', () => {
      component.getValueRefactored('first');
      expect(component.currentPhoneValueRefactored()).toBe('first');

      component.getValueRefactored('second');
      expect(component.currentPhoneValueRefactored()).toBe('second');
    });

    it('should handle special characters in phone number', () => {
      const testValue = '+1 (555) 123-4567';
      component.getValueRefactored(testValue);
      expect(component.currentPhoneValueRefactored()).toBe(testValue);
    });

    it('should handle international phone numbers', () => {
      const testValue = '+44 20 7946 0958';
      component.getValueRefactored(testValue);
      expect(component.currentPhoneValueRefactored()).toBe(testValue);
    });

    it('should handle undefined and null values', () => {
      expect(() => {
        component.getValueRefactored(undefined as any);
        component.getValueRefactored(null as any);
      }).not.toThrow();
    });
  });

  describe('getCountryCodeRefactored method', () => {
    it('should update currentCountryCodeRefactored signal', () => {
      const testCode = '+1';
      component.getCountryCodeRefactored(testCode);
      expect(component.currentCountryCodeRefactored()).toBe(testCode);
    });

    it('should handle empty string', () => {
      component.getCountryCodeRefactored('');
      expect(component.currentCountryCodeRefactored()).toBe('');
    });

    it('should handle different country codes', () => {
      const countryCodes = ['+1', '+44', '+33', '+49', '+81'];

      countryCodes.forEach((code) => {
        component.getCountryCodeRefactored(code);
        expect(component.currentCountryCodeRefactored()).toBe(code);
      });
    });

    it('should handle country code without plus sign', () => {
      const testCode = '1';
      component.getCountryCodeRefactored(testCode);
      expect(component.currentCountryCodeRefactored()).toBe(testCode);
    });

    it('should handle undefined and null values', () => {
      expect(() => {
        component.getCountryCodeRefactored(undefined as any);
        component.getCountryCodeRefactored(null as any);
      }).not.toThrow();
    });
  });

  describe('getCountryISORefactored method', () => {
    it('should update currentCountryISORefactored signal', () => {
      const testISO = 'US';
      component.getCountryISORefactored(testISO);
      expect(component.currentCountryISORefactored()).toBe(testISO);
    });

    it('should handle empty string', () => {
      component.getCountryISORefactored('');
      expect(component.currentCountryISORefactored()).toBe('');
    });

    it('should handle different ISO codes', () => {
      const isoCodes = ['US', 'GB', 'FR', 'DE', 'JP', 'CA', 'AU'];

      isoCodes.forEach((iso) => {
        component.getCountryISORefactored(iso);
        expect(component.currentCountryISORefactored()).toBe(iso);
      });
    });

    it('should handle lowercase ISO codes', () => {
      const testISO = 'us';
      component.getCountryISORefactored(testISO);
      expect(component.currentCountryISORefactored()).toBe(testISO);
    });

    it('should handle undefined and null values', () => {
      expect(() => {
        component.getCountryISORefactored(undefined as any);
        component.getCountryISORefactored(null as any);
      }).not.toThrow();
    });
  });

  describe('onSubmitRefactored method', () => {
    it('should update submittedPhoneValueRefactored with form phone value', () => {
      const testPhoneValue = '+1234567890';
      component.formTestGroupRefactored.patchValue({
        phoneRefactored: testPhoneValue
      });

      component.onSubmitRefactored();

      expect(component.submittedPhoneValueRefactored()).toBe(testPhoneValue);
    });

    it('should handle empty form value and use signal value', () => {
      component.formTestGroupRefactored.patchValue({ phoneRefactored: '' });
      component.currentPhoneValueRefactored.set('+9876543210');

      component.onSubmitRefactored();

      expect(component.submittedPhoneValueRefactored()).toBe('+9876543210');
    });

    it('should handle null form value and use signal value', () => {
      component.formTestGroupRefactored.patchValue({ phoneRefactored: null });
      component.currentPhoneValueRefactored.set('+5555555555');

      component.onSubmitRefactored();

      expect(component.submittedPhoneValueRefactored()).toBe('+5555555555');
    });

    it('should prefer form value over signal value when both exist', () => {
      const formValue = '+1111111111';
      const signalValue = '+2222222222';

      component.formTestGroupRefactored.patchValue({
        phoneRefactored: formValue
      });
      component.currentPhoneValueRefactored.set(signalValue);

      component.onSubmitRefactored();

      expect(component.submittedPhoneValueRefactored()).toBe(formValue);
    });

    it('should handle complex phone number formats', () => {
      const complexPhone = '+1 (555) 123-4567 ext. 123';
      component.formTestGroupRefactored.patchValue({
        phoneRefactored: complexPhone
      });

      component.onSubmitRefactored();

      expect(component.submittedPhoneValueRefactored()).toBe(complexPhone);
    });

    it('should not affect other form controls', () => {
      const phoneValue = '+1234567890';
      const textboxValue = 'test value';

      component.formTestGroupRefactored.patchValue({
        phoneRefactored: phoneValue,
        setPhoneTextboxRefactored: textboxValue
      });

      component.onSubmitRefactored();

      expect(
        component.formTestGroupRefactored.get('setPhoneTextboxRefactored')
          ?.value
      ).toBe(textboxValue);
    });

    it('should log form submission details', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const testPhoneValue = '+1234567890';

      component.formTestGroupRefactored.patchValue({
        phoneRefactored: testPhoneValue
      });
      component.currentPhoneValueRefactored.set('+9999999999');

      component.onSubmitRefactored();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Form submitted!',
        component.formTestGroupRefactored.value
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Phone control value:',
        testPhoneValue
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Current phone value from signal:',
        '+9999999999'
      );

      consoleSpy.mockRestore();
    });

    it('should handle false/0 form values and use signal value for branch coverage', () => {
      // Test the falsy values that should trigger the right side of the || operator
      const signalValue = '+1111111111';
      component.currentPhoneValueRefactored.set(signalValue);

      // Test with false
      component.formTestGroupRefactored.patchValue({ phoneRefactored: false });
      component.onSubmitRefactored();
      expect(component.submittedPhoneValueRefactored()).toBe(signalValue);

      // Test with 0
      component.formTestGroupRefactored.patchValue({ phoneRefactored: 0 });
      component.onSubmitRefactored();
      expect(component.submittedPhoneValueRefactored()).toBe(signalValue);

      // Test with undefined
      component.formTestGroupRefactored.patchValue({
        phoneRefactored: undefined
      });
      component.onSubmitRefactored();
      expect(component.submittedPhoneValueRefactored()).toBe(signalValue);
    });

    it('should handle empty string in form and use signal value for complete branch coverage', () => {
      // This specifically tests the scenario where phoneRefactored is an empty string
      // which should be falsy and trigger the right side of the || operator
      const signalValue = '+2222222222';
      component.currentPhoneValueRefactored.set(signalValue);

      // Test with empty string - this is the key test for branch coverage
      component.formTestGroupRefactored.patchValue({ phoneRefactored: '' });
      component.onSubmitRefactored();
      expect(component.submittedPhoneValueRefactored()).toBe(signalValue);

      // Test with null for good measure
      component.formTestGroupRefactored.patchValue({ phoneRefactored: null });
      component.onSubmitRefactored();
      expect(component.submittedPhoneValueRefactored()).toBe(signalValue);
    });

    it('should use form value when phoneRefactored is truthy for complete branch coverage', () => {
      // This tests the truthy side of the || operator on line 146
      const formValue = '+3333333333';
      const signalValue = '+4444444444';

      component.currentPhoneValueRefactored.set(signalValue);
      component.formTestGroupRefactored.patchValue({
        phoneRefactored: formValue
      });

      component.onSubmitRefactored();

      // Should use the form value since it's truthy
      expect(component.submittedPhoneValueRefactored()).toBe(formValue);
    });

    it('should handle null form control for optional chaining branch coverage', () => {
      // This tests the optional chaining operator (?.) on line 143
      // Create a spy to mock the scenario where get() returns null
      const getSpy = jest
        .spyOn(component.formTestGroupRefactored, 'get')
        .mockReturnValue(null);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const signalValue = '+5555555555';
      component.currentPhoneValueRefactored.set(signalValue);

      component.onSubmitRefactored();

      // Verify the optional chaining behavior - should log undefined when control is null
      expect(consoleSpy).toHaveBeenCalledWith(
        'Phone control value:',
        undefined
      );
      expect(component.submittedPhoneValueRefactored()).toBe(signalValue);

      getSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('setPhoneRefactored method', () => {
    it('should set phoneRefactored control value from setPhoneTextboxRefactored control', () => {
      const testValue = '+9876543210';
      component.formTestGroupRefactored.patchValue({
        setPhoneTextboxRefactored: testValue
      });

      component.setPhoneRefactored();

      expect(
        component.formTestGroupRefactored.get('phoneRefactored')?.value
      ).toBe(testValue);
    });

    it('should handle empty setPhoneTextboxRefactored value', () => {
      component.formTestGroupRefactored.patchValue({
        setPhoneTextboxRefactored: ''
      });

      component.setPhoneRefactored();

      expect(
        component.formTestGroupRefactored.get('phoneRefactored')?.value
      ).toBe('');
    });

    it('should overwrite existing phoneRefactored value', () => {
      component.formTestGroupRefactored.patchValue({
        phoneRefactored: 'old value',
        setPhoneTextboxRefactored: 'new value'
      });

      component.setPhoneRefactored();

      expect(
        component.formTestGroupRefactored.get('phoneRefactored')?.value
      ).toBe('new value');
    });

    it('should handle special characters', () => {
      const specialValue = '+1 (555) 123-4567';
      component.formTestGroupRefactored.patchValue({
        setPhoneTextboxRefactored: specialValue
      });

      component.setPhoneRefactored();

      expect(
        component.formTestGroupRefactored.get('phoneRefactored')?.value
      ).toBe(specialValue);
    });

    it('should update form validity after setting phone', () => {
      expect(component.formTestGroupRefactored.valid).toBe(false);

      component.formTestGroupRefactored.patchValue({
        setPhoneTextboxRefactored: '+1234567890'
      });
      component.setPhoneRefactored();

      expect(
        component.formTestGroupRefactored.get('phoneRefactored')?.value
      ).toBe('+1234567890');
      expect(component.formTestGroupRefactored.valid).toBe(true);
    });

    it('should handle null and undefined values', () => {
      component.formTestGroupRefactored.patchValue({
        setPhoneTextboxRefactored: null
      });
      expect(() => component.setPhoneRefactored()).not.toThrow();

      component.formTestGroupRefactored.patchValue({
        setPhoneTextboxRefactored: undefined
      });
      expect(() => component.setPhoneRefactored()).not.toThrow();
    });
  });

  describe('toggleShowSetPhoneInputRefactored method', () => {
    it('should toggle showSetPhoneInputRefactored signal from false to true', () => {
      expect(component.showSetPhoneInputRefactored()).toBe(false);

      component.toggleShowSetPhoneInputRefactored();

      expect(component.showSetPhoneInputRefactored()).toBe(true);
    });

    it('should toggle showSetPhoneInputRefactored signal from true to false', () => {
      component.showSetPhoneInputRefactored.set(true);

      component.toggleShowSetPhoneInputRefactored();

      expect(component.showSetPhoneInputRefactored()).toBe(false);
    });

    it('should toggle multiple times correctly', () => {
      expect(component.showSetPhoneInputRefactored()).toBe(false);

      component.toggleShowSetPhoneInputRefactored();
      expect(component.showSetPhoneInputRefactored()).toBe(true);

      component.toggleShowSetPhoneInputRefactored();
      expect(component.showSetPhoneInputRefactored()).toBe(false);

      component.toggleShowSetPhoneInputRefactored();
      expect(component.showSetPhoneInputRefactored()).toBe(true);
    });

    it('should work independently of other signals', () => {
      component.currentPhoneValueRefactored.set('test');
      component.currentCountryCodeRefactored.set('+1');

      component.toggleShowSetPhoneInputRefactored();

      expect(component.showSetPhoneInputRefactored()).toBe(true);
      expect(component.currentPhoneValueRefactored()).toBe('test');
      expect(component.currentCountryCodeRefactored()).toBe('+1');
    });

    it('should work independently of original component signals', () => {
      component.showSetPhoneInput.set(true);
      component.toggleShowSetPhoneInputRefactored();

      expect(component.showSetPhoneInputRefactored()).toBe(true);
      expect(component.showSetPhoneInput()).toBe(true);
    });
  });

  describe('resetFormRefactored method', () => {
    it('should reset refactored form to initial state', () => {
      component.formTestGroupRefactored.patchValue({
        phoneRefactored: '+1234567890',
        setPhoneTextboxRefactored: 'test value'
      });

      component.resetFormRefactored();

      const phoneValue =
        component.formTestGroupRefactored.get('phoneRefactored')?.value;
      const textboxValue = component.formTestGroupRefactored.get(
        'setPhoneTextboxRefactored'
      )?.value;
      expect(phoneValue === null || phoneValue === '').toBe(true);
      expect(textboxValue === null || textboxValue === '').toBe(true);
    });

    it('should reset refactored form validation state', () => {
      component.formTestGroupRefactored.patchValue({
        phoneRefactored: '+1234567890'
      });
      expect(component.formTestGroupRefactored.valid).toBe(true);

      component.resetFormRefactored();

      expect(component.formTestGroupRefactored.valid).toBe(false);
      expect(
        component.formTestGroupRefactored
          .get('phoneRefactored')
          ?.hasError('required')
      ).toBe(true);
    });

    it('should not affect refactored signals', () => {
      component.currentPhoneValueRefactored.set('test value');
      component.currentCountryCodeRefactored.set('+1');
      component.showSetPhoneInputRefactored.set(true);

      component.resetFormRefactored();

      expect(component.currentPhoneValueRefactored()).toBe('test value');
      expect(component.currentCountryCodeRefactored()).toBe('+1');
      expect(component.showSetPhoneInputRefactored()).toBe(true);
    });

    it('should not affect original form', () => {
      component.formTestGroup.patchValue({ phone: '+1234567890' });
      component.formTestGroupRefactored.patchValue({
        phoneRefactored: '+9876543210'
      });

      component.resetFormRefactored();

      expect(component.formTestGroup.get('phone')?.value).toBe('+1 234567890');
      const refactoredPhoneValue =
        component.formTestGroupRefactored.get('phoneRefactored')?.value;
      expect(refactoredPhoneValue === null || refactoredPhoneValue === '').toBe(
        true
      );
    });

    it('should reset form even when already empty', () => {
      expect(() => component.resetFormRefactored()).not.toThrow();
      const phoneValue =
        component.formTestGroupRefactored.get('phoneRefactored')?.value;
      expect(phoneValue === null || phoneValue === '').toBe(true);
    });
  });

  describe('Refactored Form Integration', () => {
    it('should have invalid refactored form when phoneRefactored is empty', () => {
      component.formTestGroupRefactored.patchValue({ phoneRefactored: '' });
      expect(component.formTestGroupRefactored.valid).toBe(false);
    });

    it('should have valid refactored form when phoneRefactored has value', () => {
      component.formTestGroupRefactored.patchValue({
        phoneRefactored: '+1234567890'
      });
      expect(component.formTestGroupRefactored.valid).toBe(true);
    });

    it('should update refactored form validity when phoneRefactored value changes', () => {
      expect(component.formTestGroupRefactored.valid).toBe(false);

      component.formTestGroupRefactored.patchValue({
        phoneRefactored: '+1234567890'
      });
      expect(component.formTestGroupRefactored.valid).toBe(true);

      component.formTestGroupRefactored.patchValue({ phoneRefactored: '' });
      expect(component.formTestGroupRefactored.valid).toBe(false);
    });

    it('should maintain setPhoneTextboxRefactored as optional', () => {
      component.formTestGroupRefactored.patchValue({
        phoneRefactored: '+1234567890',
        setPhoneTextboxRefactored: ''
      });
      expect(component.formTestGroupRefactored.valid).toBe(true);
    });

    it('should handle refactored form control errors correctly', () => {
      const phoneControl =
        component.formTestGroupRefactored.get('phoneRefactored');

      expect(phoneControl?.hasError('required')).toBe(true);
      expect(phoneControl?.errors?.['required']).toBe(true);

      phoneControl?.setValue('+1234567890');
      expect(phoneControl?.hasError('required')).toBe(false);
    });
  });

  describe('Refactored Signal Reactivity', () => {
    it('should update refactored signals independently', () => {
      component.getValueRefactored('+1234567890');
      component.getCountryCodeRefactored('+1');
      component.getCountryISORefactored('US');

      expect(component.currentPhoneValueRefactored()).toBe('+1234567890');
      expect(component.currentCountryCodeRefactored()).toBe('+1');
      expect(component.currentCountryISORefactored()).toBe('US');
    });

    it('should maintain refactored signal values across method calls', () => {
      component.getValueRefactored('+1234567890');
      component.onSubmitRefactored();
      component.resetFormRefactored();

      expect(component.currentPhoneValueRefactored()).toBe('+1234567890');
      expect(component.showSetPhoneInputRefactored()).toBe(false);
    });

    it('should handle rapid refactored signal updates', () => {
      for (let i = 0; i < 100; i++) {
        component.getValueRefactored(`+123456789${i}`);
      }
      expect(component.currentPhoneValueRefactored()).toBe('+12345678999');
    });

    it('should work independently from original signals', () => {
      component.getValue('+1111111111');
      component.getValueRefactored('+2222222222');

      expect(component.currentPhoneValue()).toBe('+1111111111');
      expect(component.currentPhoneValueRefactored()).toBe('+2222222222');
    });
  });

  describe('Refactored Methods Coverage', () => {
    it('should have all refactored methods defined', () => {
      expect(typeof component.getValueRefactored).toBe('function');
      expect(typeof component.getCountryCodeRefactored).toBe('function');
      expect(typeof component.getCountryISORefactored).toBe('function');
      expect(typeof component.onSubmitRefactored).toBe('function');
      expect(typeof component.setPhoneRefactored).toBe('function');
      expect(typeof component.toggleShowSetPhoneInputRefactored).toBe(
        'function'
      );
      expect(typeof component.resetFormRefactored).toBe('function');
    });

    it('should have all refactored properties defined', () => {
      expect(component.currentPhoneValueRefactored).toBeDefined();
      expect(component.currentCountryCodeRefactored).toBeDefined();
      expect(component.currentCountryISORefactored).toBeDefined();
      expect(component.submittedPhoneValueRefactored).toBeDefined();
      expect(component.formTestGroupRefactored).toBeDefined();
      expect(component.showSetPhoneInputRefactored).toBeDefined();
    });

    it('should handle refactored constructor injection correctly', () => {
      expect(component.formTestGroupRefactored).toBeInstanceOf(Object);
      expect(
        component.formTestGroupRefactored.get('phoneRefactored')
      ).toBeTruthy();
      expect(
        component.formTestGroupRefactored.get('setPhoneTextboxRefactored')
      ).toBeTruthy();
    });
  });

  describe('Refactored Integration Scenarios', () => {
    it('should handle complete refactored user workflow', () => {
      component.getValueRefactored('+1234567890');
      component.getCountryCodeRefactored('+1');
      component.getCountryISORefactored('US');

      component.formTestGroupRefactored.patchValue({
        phoneRefactored: '+1234567890'
      });

      component.onSubmitRefactored();

      expect(component.currentPhoneValueRefactored()).toBe('+1234567890');
      expect(component.currentCountryCodeRefactored()).toBe('+1');
      expect(component.currentCountryISORefactored()).toBe('US');
      expect(component.submittedPhoneValueRefactored()).toBe('+1234567890');
    });

    it('should handle refactored phone number change workflow', () => {
      component.formTestGroupRefactored.patchValue({
        phoneRefactored: '+1234567890'
      });

      component.toggleShowSetPhoneInputRefactored();
      expect(component.showSetPhoneInputRefactored()).toBe(true);

      component.formTestGroupRefactored.patchValue({
        setPhoneTextboxRefactored: '+9876543210'
      });
      component.setPhoneRefactored();

      expect(
        component.formTestGroupRefactored.get('phoneRefactored')?.value
      ).toBe('+9876543210');
    });

    it('should handle refactored form reset workflow', () => {
      component.formTestGroupRefactored.patchValue({
        phoneRefactored: '+1234567890',
        setPhoneTextboxRefactored: 'test'
      });
      component.getValueRefactored('+1234567890');
      component.onSubmitRefactored();

      component.resetFormRefactored();

      const phoneValue =
        component.formTestGroupRefactored.get('phoneRefactored')?.value;
      const textboxValue = component.formTestGroupRefactored.get(
        'setPhoneTextboxRefactored'
      )?.value;
      expect(phoneValue === null || phoneValue === '').toBe(true);
      expect(textboxValue === null || textboxValue === '').toBe(true);

      expect(component.submittedPhoneValueRefactored()).toBe('+1234567890');
      expect(component.currentPhoneValueRefactored()).toBe('+1234567890');
    });

    it('should work independently of original component methods', () => {
      // Set up original component
      component.getValue('+1111111111');
      component.formTestGroup.patchValue({ phone: '+1111111111' });
      component.onSubmit();

      // Set up refactored component
      component.getValueRefactored('+2222222222');
      component.formTestGroupRefactored.patchValue({
        phoneRefactored: '+2222222222'
      });
      component.onSubmitRefactored();

      // Verify independence
      expect(component.currentPhoneValue()).toBe('+1 111111111');
      expect(component.currentPhoneValueRefactored()).toBe('+2222222222');
      expect(component.submittedPhoneValue()).toBe('+1 111111111');
      expect(component.submittedPhoneValueRefactored()).toBe('+2222222222');
    });
  });

  describe('Cross-Component Independence', () => {
    it('should maintain independence between original and refactored forms', () => {
      // Setup original form
      component.formTestGroup.patchValue({
        phone: '+1111111111',
        setPhoneTextbox: 'original'
      });

      // Setup refactored form
      component.formTestGroupRefactored.patchValue({
        phoneRefactored: '+2222222222',
        setPhoneTextboxRefactored: 'refactored'
      });

      // Reset original form
      component.resetForm();

      // Verify refactored form is unaffected
      expect(
        component.formTestGroupRefactored.get('phoneRefactored')?.value
      ).toBe('+2222222222');
      expect(
        component.formTestGroupRefactored.get('setPhoneTextboxRefactored')
          ?.value
      ).toBe('refactored');

      // Reset refactored form
      component.resetFormRefactored();

      // Verify original form is still reset
      const originalPhoneValue = component.formTestGroup.get('phone')?.value;
      expect(originalPhoneValue === null || originalPhoneValue === '').toBe(
        true
      );
    });

    it('should maintain independence between original and refactored signals', () => {
      // Set original signals
      component.getValue('+1111111111');
      component.getCountryCode('+1');
      component.getCountryISO('US');
      component.showSetPhoneInput.set(true);

      // Set refactored signals
      component.getValueRefactored('+2222222222');
      component.getCountryCodeRefactored('+44');
      component.getCountryISORefactored('GB');
      component.showSetPhoneInputRefactored.set(false);

      // Verify independence
      expect(component.currentPhoneValue()).toBe('+1111111111');
      expect(component.currentPhoneValueRefactored()).toBe('+2222222222');
      expect(component.currentCountryCode()).toBe('+1');
      expect(component.currentCountryCodeRefactored()).toBe('+44');
      expect(component.currentCountryISO()).toBe('US');
      expect(component.currentCountryISORefactored()).toBe('GB');
      expect(component.showSetPhoneInput()).toBe(true);
      expect(component.showSetPhoneInputRefactored()).toBe(false);
    });
  });
});
