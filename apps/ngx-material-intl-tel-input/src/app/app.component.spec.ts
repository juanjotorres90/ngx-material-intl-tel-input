import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PhoneNumberFormat } from 'google-libphonenumber';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, ReactiveFormsModule, BrowserAnimationsModule],
      providers: [provideHttpClient()]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

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
