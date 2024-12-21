import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxMaterialIntlTelInputComponent } from './ngx-material-intl-tel-input-lib.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';
import { Country } from '../types/country.model';
import { provideHttpClient } from '@angular/common/http';
import { ControlContainer, FormControl, Validators } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { GeoData } from '../types/geo.type';
import { GeoIpService } from '../services/geo-ip/geo-ip.service';

describe('NgxMaterialIntlTelInputComponent', () => {
  let component: NgxMaterialIntlTelInputComponent;
  let fixture: ComponentFixture<NgxMaterialIntlTelInputComponent>;
  let phoneNumberUtil: PhoneNumberUtil;
  const geoIpServiceMock = {
    geoIpLookup: jest.fn().mockReturnValue(of({} as GeoData))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxMaterialIntlTelInputComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        ControlContainer,
        { provide: GeoIpService, useValue: geoIpServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NgxMaterialIntlTelInputComponent);
    component = fixture.componentInstance;
    phoneNumberUtil = PhoneNumberUtil.getInstance();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize component with default values', () => {
    component.ngOnInit();
    expect(component.prefixCtrl.value).toBeNull();
    expect(component.prefixFilterCtrl.value).toBe('');
    expect(component.fieldControl()?.value).toBe('');
    expect(component.required()).toBe(false);
    expect(component.disabled()).toBe(false);
    expect(component.enablePlaceholder()).toBe(true);
    expect(component.enableSearch()).toBe(true);
    expect(component.includeDialCode()).toBe(false);
    expect(component.autoIpLookup()).toBe(true);
    expect(component.autoSelectCountry()).toBe(true);
    expect(component.autoSelectedCountry()).toBe('');
    expect(component.numberValidation()).toBe(true);
    expect(component.iconMakeCall()).toBe(true);
    expect(component.initialValue()).toBe('');
    expect(component.preferredCountries()).toEqual([]);
    expect(component.visibleCountries()).toEqual([]);
    expect(component.excludedCountries()).toEqual([]);
    expect(component.textLabels()).toEqual({
      mainLabel: 'Phone number',
      codePlaceholder: 'Code',
      searchPlaceholderLabel: 'Search',
      noEntriesFoundLabel: 'No countries found',
      nationalNumberLabel: 'Number',
      hintLabel: 'Select country and type your phone number',
      invalidNumberError: 'Number is not valid',
      requiredError: 'This field is required'
    });
    expect(component.isFocused()).toBe(false);
    expect(component.isLoading()).toBe(true);
  });

  it('should set fieldControl value to the entered phone number when is not valid', () => {
    component.ngOnInit();
    const phoneNumber = '678906543';
    component.telForm.get('numberControl')?.setValue(phoneNumber);
    expect(component.fieldControl()?.value).toBe(phoneNumber);
  });

  it('should set fieldControl value to the entered phone number when is valid', () => {
    component.ngOnInit();
    const phoneNumber = '+34678906543';
    const phoneNumberUtil = PhoneNumberUtil.getInstance();
    const parsed = phoneNumberUtil.parse(phoneNumber);
    const formatted = phoneNumberUtil.format(
      parsed,
      PhoneNumberFormat.INTERNATIONAL
    );
    component.telForm.get('numberControl')?.setValue(phoneNumber);
    expect(component.fieldControl()?.value).toBe(formatted);
  });

  it('should select a country from the dropdown', () => {
    component.ngOnInit();
    const country: Country = {
      emojiFlag: '🇪🇸',
      name: 'Spain (España)',
      iso2: 'es',
      dialCode: '34',
      priority: 0,
      htmlId: 'country-code__es',
      flagClass: 'country-code__es',
      placeHolder: '612 34 56 78'
    };
    component.prefixCtrl.setValue(country);
    expect(component.prefixCtrl.value).toEqual(country);
  });

  describe('startFieldControlValueChangesListener', () => {
    let valueChangesSubject: Subject<string>;

    beforeEach(() => {
      valueChangesSubject = new Subject<string>();
      jest.spyOn(component, 'fieldControl').mockReturnValue({
        valueChanges: valueChangesSubject.asObservable(),
        setValue: jest.fn()
      } as any);
      component.prefixCtrl = new FormControl({
        iso2: 'US',
        dialCode: '1'
      } as Country);
      component['_onDestroy'] = new Subject<void>();
      component.currentValue = { emit: jest.fn() } as any;
      component.currentCountryCode = { emit: jest.fn() } as any;
      component.currentCountryISO = { emit: jest.fn() } as any;
      component['startFieldControlValueChangesListener']();
    });

    it('should format and set the value if valid', () => {
      const parsedNumber = phoneNumberUtil.parse('1234567890', 'US');
      const formattedNumber = phoneNumberUtil.format(
        parsedNumber,
        PhoneNumberFormat.INTERNATIONAL
      );
      valueChangesSubject.next('+1 1234567890');
      expect(component.fieldControl()?.setValue).toHaveBeenCalledWith(
        formattedNumber,
        { emitEvent: false }
      );
    });

    it('should set the value as is if invalid', () => {
      valueChangesSubject.next('invalid');
      expect(component.fieldControl()?.setValue).toHaveBeenCalledWith(
        'invalid',
        { emitEvent: false }
      );
    });

    it('should emit current value, country code, and ISO', () => {
      valueChangesSubject.next('1234567890');
      expect(component.currentValue.emit).toHaveBeenCalledWith('1234567890');
      expect(component.currentCountryCode.emit).toHaveBeenCalledWith('+1');
      expect(component.currentCountryISO.emit).toHaveBeenCalledWith('US');
    });
  });

  describe('startFieldControlStatusChangesListener', () => {
    let statusChangesSubject: Subject<string>;

    beforeEach(() => {
      statusChangesSubject = new Subject<string>();
      jest.spyOn(component, 'fieldControl').mockReturnValue({
        statusChanges: statusChangesSubject.asObservable()
      } as any);
      component['_onDestroy'] = new Subject<void>();
      component.disabled = { set: jest.fn() } as any;
      component['startFieldControlStatusChangesListener']();
    });

    it('should set disabled to true if status is DISABLED', () => {
      statusChangesSubject.next('DISABLED');
      expect(component.disabled.set).toHaveBeenCalledWith(true);
    });

    it('should set disabled to false if status is not DISABLED', () => {
      statusChangesSubject.next('ENABLED');
      expect(component.disabled.set).toHaveBeenCalledWith(false);
    });
  });

  describe('ngOnInit', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      component.prefixFilterCtrl = new FormControl();
      component.filteredCountries = { next: jest.fn() } as any;
      component.allCountries = [
        { name: 'Spain', iso2: 'es' } as Country,
        { name: 'United States', iso2: 'us' } as Country
      ];
      component.ngOnInit();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should call setInitialTelValue', () => {
      const setInitialTelValueSpy = jest.spyOn(
        component as any,
        'setInitialTelValue'
      );
      component.ngOnInit();
      jest.advanceTimersByTime(0);
      expect(setInitialTelValueSpy).toHaveBeenCalled();
    });

    it('should set filteredCountries to allCountries if no search keyword', () => {
      component.prefixFilterCtrl.setValue('');
      component.ngOnInit();
      expect(component.filteredCountries.next).toHaveBeenCalledWith(
        component.allCountries
      );
    });
    it('should set isFocused to true on input focus', () => {
      component.onInputFocus();
      expect(component.isFocused()).toBe(true);
    });

    it('should set isFocused to false on input blur', () => {
      component.onInputBlur();
      expect(component.isFocused()).toBe(false);
    });
  });

  describe('setRequiredValidators', () => {
    beforeEach(() => {
      component.fieldControl.set(new FormControl());
    });

    it('should add required validator if required is true', () => {
      component.required.set(true);
      component.setRequiredValidators();
      expect(component.fieldControl()?.hasValidator(Validators.required)).toBe(
        true
      );
    });

    it('should remove required validator if required is false', () => {
      component.required.set(false);
      component.fieldControl()?.addValidators(Validators.required);
      component.setRequiredValidators();
      expect(component.fieldControl()?.hasValidator(Validators.required)).toBe(
        false
      );
    });
  });

  describe('setDisabledState', () => {
    beforeEach(() => {
      component.fieldControl.set(new FormControl());
    });

    it('should disable the field control if disabled is true', () => {
      component.disabled.set(true);
      component.setDisabledState();
      expect(component.fieldControl()?.disabled).toBe(true);
    });

    it('should enable the field control if disabled is false', () => {
      component.disabled.set(false);
      component.fieldControl()?.disable();
      component.setDisabledState();
      expect(component.fieldControl()?.disabled).toBe(false);
    });
  });
});
