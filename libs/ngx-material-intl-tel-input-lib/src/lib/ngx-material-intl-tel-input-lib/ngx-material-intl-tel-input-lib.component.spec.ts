import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxMaterialIntlTelInputComponent } from './ngx-material-intl-tel-input-lib.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';
import { Country } from '../types/country.model';
import { provideHttpClient } from '@angular/common/http';
import { ControlContainer } from '@angular/forms';

describe('NgxMaterialIntlTelInputComponent', () => {
  let component: NgxMaterialIntlTelInputComponent;
  let fixture: ComponentFixture<NgxMaterialIntlTelInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxMaterialIntlTelInputComponent, NoopAnimationsModule],
      providers: [provideHttpClient(), ControlContainer]
    }).compileComponents();

    fixture = TestBed.createComponent(NgxMaterialIntlTelInputComponent);
    component = fixture.componentInstance;
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
});
