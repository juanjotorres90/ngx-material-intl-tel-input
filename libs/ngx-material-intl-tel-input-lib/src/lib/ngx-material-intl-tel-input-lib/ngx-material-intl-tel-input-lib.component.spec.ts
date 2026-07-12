import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxMaterialIntlTelInputComponent } from './ngx-material-intl-tel-input-lib.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { parsePhoneNumberWithError } from 'libphonenumber-js';
import { PhoneNumberFormat } from '../enums/phone-number-format.enum';
import { formatPhoneNumber } from '../utils/phone-number.utils';
import { Country } from '../types/country.model';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { ControlContainer, FormControl, Validators } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { GeoData } from '../types/geo.type';
import { GeoIpService } from '../services/geo-ip/geo-ip.service';

describe('NgxMaterialIntlTelInputComponent', () => {
  let component: NgxMaterialIntlTelInputComponent;
  let fixture: ComponentFixture<NgxMaterialIntlTelInputComponent>;
  const geoIpServiceMock = {
    geoIpLookup: jest.fn().mockReturnValue(of({} as GeoData))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxMaterialIntlTelInputComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(withFetch()),
        ControlContainer,
        { provide: GeoIpService, useValue: geoIpServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NgxMaterialIntlTelInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
    jest.clearAllMocks();
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
    expect(component.autoIpLookup()).toBe(false);
    expect(component.autoSelectCountry()).toBe(true);
    expect(component.autoSelectedCountry()).toBe('');
    expect(component.defaultCountry()).toBe('es');
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
      nationalNumberLabel: '',
      hintLabel: 'Select country and type your phone number',
      invalidNumberError: 'Number is not valid',
      requiredError: 'This field is required',
      numberTooLongError: 'Phone number is too long'
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
    const formatted = formatPhoneNumber(
      parsePhoneNumberWithError(phoneNumber),
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
      component.currentValue = { emit: jest.fn() } as any;
      component.currentCountryCode = { emit: jest.fn() } as any;
      component.currentCountryISO = { emit: jest.fn() } as any;
      component['startFieldControlValueChangesListener']();
    });

    afterEach(() => {
      valueChangesSubject.complete();
    });

    it('should format and set the value if valid', () => {
      const formattedNumber = formatPhoneNumber(
        parsePhoneNumberWithError('+1 1234567890'),
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

    it('should sync the selected country from a full international value', () => {
      valueChangesSubject.next('+34678906543');
      expect(component.prefixCtrl.value?.iso2).toBe('es');
    });
  });

  describe('startFieldControlStatusChangesListener', () => {
    let statusChangesSubject: Subject<string>;

    beforeEach(() => {
      statusChangesSubject = new Subject<string>();
      jest.spyOn(component, 'fieldControl').mockReturnValue({
        statusChanges: statusChangesSubject.asObservable()
      } as any);
      component.disabled = { set: jest.fn() } as any;
      component['startFieldControlStatusChangesListener']();
    });

    afterEach(() => {
      statusChangesSubject.complete();
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

    it('should set isFocused to true on input focus', () => {
      component.onInputFocus();
      expect(component.isFocused()).toBe(true);
    });

    it('should set isFocused to false on input blur', () => {
      component.onInputBlur();
      expect(component.isFocused()).toBe(false);
    });
  });

  describe('filteredCountries', () => {
    beforeEach(() => {
      component.allCountries.set([
        { name: 'Spain (España)', iso2: 'es' } as Country,
        { name: 'United States', iso2: 'us' } as Country,
        { name: 'France', iso2: 'fr' } as Country
      ]);
    });

    it('should return all countries when search is empty', () => {
      component.prefixFilterCtrl.setValue('');
      expect(component.filteredCountries()).toEqual(component.allCountries());
    });

    it('should filter countries by name, ignoring diacritics', () => {
      component.prefixFilterCtrl.setValue('espana');
      expect(component.filteredCountries()).toEqual([
        { name: 'Spain (España)', iso2: 'es' } as Country
      ]);
    });

    it('should return empty array when no countries match', () => {
      component.prefixFilterCtrl.setValue('xyz');
      expect(component.filteredCountries()).toEqual([]);
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

  describe('applyDisabledState', () => {
    beforeEach(() => {
      component.fieldControl.set(new FormControl());
    });

    it('should disable the field control if disabled is true', () => {
      component.disabled.set(true);
      component.applyDisabledState();
      expect(component.fieldControl()?.disabled).toBe(true);
    });

    it('should enable the field control if disabled is false', () => {
      component.disabled.set(false);
      component.fieldControl()?.disable();
      component.applyDisabledState();
      expect(component.fieldControl()?.disabled).toBe(false);
    });
  });

  describe('fetchCountryData', () => {
    beforeEach(() => {
      (component as any).countryDataService = {
        processCountries: jest
          .fn()
          .mockReturnValue([
            { name: 'Spain', iso2: 'es', dialCode: '34' } as Country,
            { name: 'United States', iso2: 'us', dialCode: '1' } as Country
          ])
      };
    });

    it('should fetch and set country data', () => {
      component['fetchCountryData']();
      expect(
        (component as any).countryDataService.processCountries
      ).toHaveBeenCalledWith((component as any).countryCodeData, {
        enablePlaceholder: component.enablePlaceholder(),
        includeDialCode: component.includeDialCode(),
        visibleCountries: component.visibleCountries(),
        preferredCountries: component.preferredCountries(),
        excludedCountries: component.excludedCountries(),
        useMask: component.useMask(),
        forceSelectedCountryCode: component.forceSelectedCountryCode(),
        showMaskPlaceholder: component.showMaskPlaceholder(),
        outputNumberFormat: component.outputNumberFormat(),
        localizeCountryNames: component.localizeCountryNames()
      });
      expect(component.allCountries()).toHaveLength(2);
    });
  });

  describe('addValidations', () => {
    beforeEach(() => {
      component.fieldControl.set(new FormControl());
      jest.spyOn(component, 'setRequiredValidators');
      jest.spyOn(component, 'applyDisabledState');
    });

    it('should call setRequiredValidators and applyDisabledState', () => {
      component['addValidations']();
      expect(component.setRequiredValidators).toHaveBeenCalled();
      expect(component.applyDisabledState).toHaveBeenCalled();
    });

    it('should add number validation when numberValidation is true', () => {
      Object.defineProperty(component, 'numberValidation', {
        value: jest.fn().mockReturnValue(true),
        writable: true
      });
      const addValidatorsSpy = jest.spyOn(
        component.fieldControl()!,
        'addValidators'
      );
      component['addValidations']();
      expect(addValidatorsSpy).toHaveBeenCalled();
    });

    it('should not add number validation when numberValidation is false', () => {
      Object.defineProperty(component, 'numberValidation', {
        value: jest.fn().mockReturnValue(false),
        writable: true
      });
      const addValidatorsSpy = jest.spyOn(
        component.fieldControl()!,
        'addValidators'
      );
      component['addValidations']();
      expect(addValidatorsSpy).not.toHaveBeenCalled();
    });
  });

  describe('ngAfterViewInit', () => {
    it('should set the compareWith function on the country select', () => {
      const mockSelect = { compareWith: null } as any;
      component.singleSelect = jest.fn().mockReturnValue(mockSelect) as any;

      component.ngAfterViewInit();

      expect(mockSelect.compareWith).toBeDefined();
      expect(
        mockSelect.compareWith(
          { iso2: 'es' } as Country,
          {
            iso2: 'es'
          } as Country
        )
      ).toBe(true);
      expect(
        mockSelect.compareWith(
          { iso2: 'es' } as Country,
          {
            iso2: 'us'
          } as Country
        )
      ).toBe(false);
    });

    it('should handle a missing singleSelect element', () => {
      component.singleSelect = jest.fn().mockReturnValue(undefined) as any;
      expect(() => component.ngAfterViewInit()).not.toThrow();
    });
  });

  describe('geoIpLookup', () => {
    beforeEach(() => {
      component.allCountries.set([
        { name: 'Spain', iso2: 'es', dialCode: '34' } as Country,
        { name: 'United States', iso2: 'us', dialCode: '1' } as Country
      ]);
      jest.spyOn(component as any, 'setAutoSelectedCountry');
      (component as any).geoIpService = geoIpServiceMock;
    });

    it('should set prefix control when country is found', () => {
      const mockGeoData = { country_code: 'ES' } as GeoData;
      geoIpServiceMock.geoIpLookup.mockReturnValue(of(mockGeoData));

      component['geoIpLookup']();

      expect(component.prefixCtrl.value?.iso2).toBe('es');
      expect(component.isLoading()).toBe(false);
    });

    it('should call setAutoSelectedCountry when country is not found', () => {
      const mockGeoData = { country_code: 'XX' } as GeoData;
      geoIpServiceMock.geoIpLookup.mockReturnValue(of(mockGeoData));

      component['geoIpLookup']();

      expect(component['setAutoSelectedCountry']).toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });

    it('should call setAutoSelectedCountry and stop loading on error', () => {
      const errorObservable = new Subject<GeoData>();
      geoIpServiceMock.geoIpLookup.mockReturnValue(
        errorObservable.asObservable()
      );

      component['geoIpLookup']();
      errorObservable.error(new Error('Network error'));

      expect(component['setAutoSelectedCountry']).toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });

    it('should handle null country_code', () => {
      const mockGeoData = { country_code: null } as unknown as GeoData;
      geoIpServiceMock.geoIpLookup.mockReturnValue(of(mockGeoData));

      component['geoIpLookup']();

      expect(component['setAutoSelectedCountry']).toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });

    it('should handle undefined country_code', () => {
      const mockGeoData = {} as unknown as GeoData;
      geoIpServiceMock.geoIpLookup.mockReturnValue(of(mockGeoData));

      component['geoIpLookup']();

      expect(component['setAutoSelectedCountry']).toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('startTelFormValueChangesListener', () => {
    let telFormValueChangesSubject: Subject<any>;

    beforeEach(() => {
      telFormValueChangesSubject = new Subject<any>();
      component.telForm = {
        valueChanges: telFormValueChangesSubject.asObservable(),
        get: jest.fn().mockReturnValue({ setValue: jest.fn() })
      } as any;
      component.numberInput = jest.fn().mockReturnValue({
        nativeElement: { selectionStart: 5, setSelectionRange: jest.fn() }
      }) as any;
      component.fieldControl.set(new FormControl());
      jest.spyOn(component as any, 'setCursorPosition');
      Object.defineProperty(component, 'includeDialCode', {
        value: jest.fn().mockReturnValue(false),
        writable: true
      });
      component['startTelFormValueChangesListener']();
    });

    afterEach(() => {
      telFormValueChangesSubject.complete();
    });

    it('should format valid phone number with dial code', () => {
      const mockData = {
        numberControl: '1234567890',
        prefixCtrl: { dialCode: '1', iso2: 'us' }
      };

      telFormValueChangesSubject.next(mockData);
      expect(component.fieldControl()?.value).toContain('+1');
    });

    it('should handle invalid phone number', () => {
      const mockData = {
        numberControl: 'invalid',
        prefixCtrl: { dialCode: '1', iso2: 'us' }
      };

      telFormValueChangesSubject.next(mockData);
      expect(component.fieldControl()?.value).toBe('+1invalid');
    });

    it('should set empty value when numberControl is empty', () => {
      const mockData = {
        numberControl: '',
        prefixCtrl: { dialCode: '1', iso2: 'us' }
      };

      telFormValueChangesSubject.next(mockData);
      expect(component.fieldControl()?.value).toBe('');
    });

    it('should handle includeDialCode scenario', () => {
      Object.defineProperty(component, 'includeDialCode', {
        value: jest.fn().mockReturnValue(true),
        writable: true
      });
      const mockData = {
        numberControl: '+12015550123',
        prefixCtrl: { dialCode: '1', iso2: 'us' }
      };

      telFormValueChangesSubject.next(mockData);
      expect(component.fieldControl()?.value).toBe('+1 201 555 0123');
    });

    it('should not restore deleted NANP area-code digits', () => {
      const mockData = {
        numberControl: '76',
        prefixCtrl: { dialCode: '1767', iso2: 'dm' }
      };

      telFormValueChangesSubject.next(mockData);

      expect(component.fieldControl()?.value).toBe('+1 76');
    });
  });

  describe('startPrefixValueChangesListener', () => {
    let prefixValueChangesSubject: Subject<Country>;

    beforeEach(() => {
      prefixValueChangesSubject = new Subject<Country>();
      component.prefixCtrl = {
        valueChanges: prefixValueChangesSubject.asObservable()
      } as any;
      component.telForm = {
        get: jest.fn().mockReturnValue({ setValue: jest.fn() })
      } as any;
      component.numberInput = jest.fn().mockReturnValue({
        nativeElement: { focus: jest.fn() }
      }) as any;
      component.isLoading.set(false);
      Object.defineProperty(component, 'includeDialCode', {
        value: jest.fn().mockReturnValue(false),
        writable: true
      });
      component['startPrefixValueChangesListener']();
    });

    afterEach(() => {
      prefixValueChangesSubject.complete();
    });

    it('should set dial code when includeDialCode is true', () => {
      Object.defineProperty(component, 'includeDialCode', {
        value: jest.fn().mockReturnValue(true),
        writable: true
      });
      const country: Country = { dialCode: '34', iso2: 'es' } as Country;

      prefixValueChangesSubject.next(country);
      expect(
        component.telForm.get('numberControl')?.setValue
      ).toHaveBeenCalledWith('+34', { emitEvent: false });
    });

    it('should focus number input when not loading', (done) => {
      const country: Country = { dialCode: '34', iso2: 'es' } as Country;

      prefixValueChangesSubject.next(country);
      setTimeout(() => {
        expect(component.numberInput()?.nativeElement.focus).toHaveBeenCalled();
        done();
      }, 1);
    });

    it('should not focus when loading', () => {
      component.isLoading.set(true);
      const country: Country = { dialCode: '34', iso2: 'es' } as Country;

      prefixValueChangesSubject.next(country);
      expect(
        component.numberInput()?.nativeElement.focus
      ).not.toHaveBeenCalled();
    });
  });

  describe('setInitialTelValue', () => {
    beforeEach(() => {
      component.allCountries.set([
        { name: 'Spain', iso2: 'es', dialCode: '34', priority: 0 } as Country,
        {
          name: 'United States',
          iso2: 'us',
          dialCode: '1',
          priority: 0
        } as Country
      ]);
      component.telForm = {
        get: jest.fn().mockReturnValue({ setValue: jest.fn() })
      } as any;
      component.fieldControl.set(new FormControl());
      jest.spyOn(component as any, 'geoIpLookup');
      jest.spyOn(component as any, 'setAutoSelectedCountry');
    });

    it('should call geoIpLookup when autoIpLookup and autoSelectCountry are true and no initial value', () => {
      Object.defineProperty(component, 'initialValue', {
        value: jest.fn().mockReturnValue(''),
        writable: true
      });
      Object.defineProperty(component, 'autoSelectCountry', {
        value: jest.fn().mockReturnValue(true),
        writable: true
      });
      Object.defineProperty(component, 'autoIpLookup', {
        value: jest.fn().mockReturnValue(true),
        writable: true
      });

      component['setInitialTelValue']();
      expect(component['geoIpLookup']).toHaveBeenCalled();
    });

    it('should call setAutoSelectedCountry when autoSelectCountry is true but autoIpLookup is false', () => {
      Object.defineProperty(component, 'initialValue', {
        value: jest.fn().mockReturnValue(''),
        writable: true
      });
      Object.defineProperty(component, 'autoSelectCountry', {
        value: jest.fn().mockReturnValue(true),
        writable: true
      });
      Object.defineProperty(component, 'autoIpLookup', {
        value: jest.fn().mockReturnValue(false),
        writable: true
      });

      component['setInitialTelValue']();
      expect(component['setAutoSelectedCountry']).toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });

    it('should set loading to false when autoSelectCountry is false', () => {
      Object.defineProperty(component, 'initialValue', {
        value: jest.fn().mockReturnValue(''),
        writable: true
      });
      Object.defineProperty(component, 'autoSelectCountry', {
        value: jest.fn().mockReturnValue(false),
        writable: true
      });

      component['setInitialTelValue']();
      expect(component.isLoading()).toBe(false);
    });

    it('should parse and set initial value when provided', () => {
      Object.defineProperty(component, 'initialValue', {
        value: jest.fn().mockReturnValue('+34678906543'),
        writable: true
      });
      jest.spyOn(component.prefixCtrl, 'setValue');

      component['setInitialTelValue']();
      expect(component.prefixCtrl.setValue).toHaveBeenCalledWith(
        expect.objectContaining({ dialCode: '34' })
      );
      expect(
        component.telForm.get('numberControl')?.setValue
      ).toHaveBeenCalledWith('678 90 65 43');
      expect(component.isLoading()).toBe(false);
    });

    it('should resolve shared calling codes via the parser (area codes)', () => {
      component.allCountries.set([
        {
          name: 'Dominica',
          iso2: 'dm',
          dialCode: '1',
          priority: 1,
          areaCodes: ['767']
        } as Country,
        {
          name: 'United States',
          iso2: 'us',
          dialCode: '1',
          priority: 0
        } as Country
      ]);
      Object.defineProperty(component, 'initialValue', {
        value: jest.fn().mockReturnValue('+17672251234'),
        writable: true
      });
      jest.spyOn(component.prefixCtrl, 'setValue');

      component['setInitialTelValue']();
      expect(component.prefixCtrl.setValue).toHaveBeenCalledWith(
        expect.objectContaining({ iso2: 'dm' })
      );
    });

    it('should handle invalid initial value', () => {
      Object.defineProperty(component, 'initialValue', {
        value: jest.fn().mockReturnValue('invalid-number'),
        writable: true
      });
      jest.spyOn(component.fieldControl()!, 'setValue');
      jest.spyOn(component.fieldControl()!, 'markAsDirty');

      component['setInitialTelValue']();
      expect(
        component.telForm.get('numberControl')?.setValue
      ).toHaveBeenCalledWith('invalid-number');
      expect(component.fieldControl()?.setValue).toHaveBeenCalledWith(
        'invalid-number'
      );
      expect(component.fieldControl()?.markAsDirty).toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });

    it('should not set prefix when no country matches the dial code', () => {
      component.allCountries.set([
        { name: 'Spain', iso2: 'es', dialCode: '34', priority: 0 } as Country,
        { name: 'France', iso2: 'fr', dialCode: '33', priority: 0 } as Country
      ]);

      Object.defineProperty(component, 'initialValue', {
        value: jest.fn().mockReturnValue('+44123456789'),
        writable: true
      });
      jest.spyOn(component.prefixCtrl, 'setValue');

      component['setInitialTelValue']();

      expect(component.prefixCtrl.setValue).not.toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('setAutoSelectedCountry', () => {
    beforeEach(() => {
      component.allCountries.set([
        { name: 'Spain', iso2: 'es', dialCode: '34' } as Country,
        { name: 'United States', iso2: 'us', dialCode: '1' } as Country,
        { name: 'France', iso2: 'fr', dialCode: '33' } as Country
      ]);
    });

    it('should set auto selected country when found', () => {
      Object.defineProperty(component, 'autoSelectedCountry', {
        value: jest.fn().mockReturnValue('us'),
        writable: true
      });

      component['setAutoSelectedCountry']();
      expect(component.prefixCtrl.value?.iso2).toBe('us');
    });

    it('should set Spain as default when auto selected country not found', () => {
      Object.defineProperty(component, 'autoSelectedCountry', {
        value: jest.fn().mockReturnValue('xx'),
        writable: true
      });

      component['setAutoSelectedCountry']();
      expect(component.prefixCtrl.value?.iso2).toBe('es');
    });

    it('should use the defaultCountry input when the auto selected country is not found', () => {
      fixture.componentRef.setInput('defaultCountry', 'fr');
      Object.defineProperty(component, 'autoSelectedCountry', {
        value: jest.fn().mockReturnValue('xx'),
        writable: true
      });

      component['setAutoSelectedCountry']();
      expect(component.prefixCtrl.value?.iso2).toBe('fr');
    });

    it('should set first country when the default country is not available', () => {
      Object.defineProperty(component, 'autoSelectedCountry', {
        value: jest.fn().mockReturnValue('xx'),
        writable: true
      });
      component.allCountries.set([
        { name: 'United States', iso2: 'us', dialCode: '1' } as Country,
        { name: 'France', iso2: 'fr', dialCode: '33' } as Country
      ]);

      component['setAutoSelectedCountry']();
      expect(component.prefixCtrl.value?.iso2).toBe('us');
    });

    it('should handle empty allCountries array', () => {
      component.allCountries.set([]);
      component['setAutoSelectedCountry']();
      expect(component.prefixCtrl.value).toBeUndefined();
    });
  });

  describe('findCountryForNumber', () => {
    it('should retain a NANP territory while its number is partial', () => {
      const dominica = {
        name: 'Dominica',
        iso2: 'dm',
        dialCode: '1767',
        priority: 0
      } as Country;
      component.allCountries.set([
        dominica,
        {
          name: 'United States',
          iso2: 'us',
          dialCode: '1',
          priority: 0
        } as Country
      ]);
      component.prefixCtrl.setValue(dominica);
      const partialNumber = parsePhoneNumberWithError('+176');

      expect(component['findCountryForNumber'](partialNumber)).toBe(dominica);
    });
  });

  describe('setFieldControl', () => {
    beforeEach(() => {
      (component as any).controlContainer = {
        control: {
          get: jest.fn()
        }
      };
    });

    it('should set field control from control container when field control name exists', () => {
      const mockControl = new FormControl('test-value');
      Object.defineProperty(component, 'fieldControlName', {
        value: jest.fn().mockReturnValue('testField'),
        writable: true
      });
      (component as any).controlContainer.control.get = jest
        .fn()
        .mockReturnValue(mockControl);

      component['setFieldControl']();
      expect(component.fieldControl()).toBe(mockControl);
      expect(component.initialValue()).toBe('test-value');
    });

    it('should set required to true when field control has required validator', () => {
      const mockControl = new FormControl('', Validators.required);
      Object.defineProperty(component, 'fieldControlName', {
        value: jest.fn().mockReturnValue('testField'),
        writable: true
      });
      (component as any).controlContainer.control.get = jest
        .fn()
        .mockReturnValue(mockControl);

      component['setFieldControl']();
      expect(component.required()).toBe(true);
    });

    it('should set disabled to true when field control is disabled', () => {
      const mockControl = new FormControl('');
      mockControl.disable();
      Object.defineProperty(component, 'fieldControlName', {
        value: jest.fn().mockReturnValue('testField'),
        writable: true
      });
      (component as any).controlContainer.control.get = jest
        .fn()
        .mockReturnValue(mockControl);

      component['setFieldControl']();
      expect(component.disabled()).toBe(true);
    });

    it('should not set field control when field control name does not exist', () => {
      Object.defineProperty(component, 'fieldControlName', {
        value: jest.fn().mockReturnValue(''),
        writable: true
      });
      const originalFieldControl = component.fieldControl();

      component['setFieldControl']();
      expect(component.fieldControl()).toBe(originalFieldControl);
    });

    it('should handle a missing control container', () => {
      (component as any).controlContainer = null;
      Object.defineProperty(component, 'fieldControlName', {
        value: jest.fn().mockReturnValue('testField'),
        writable: true
      });

      expect(() => component['setFieldControl']()).not.toThrow();
    });
  });

  describe('ControlValueAccessor', () => {
    it('should store the written value as initial value before initialization', () => {
      component.writeValue('+34678906543');
      expect(component.initialValue()).toBe('+34678906543');
    });

    it('should write the value through the field control after initialization', () => {
      component['initialized'] = true;
      component.writeValue('+34678906543');
      expect(component.fieldControl()?.value).toBe('+34 678 90 65 43');
    });

    it('should not propagate model writes back through onChange', () => {
      const onChange = jest.fn();
      component['initialized'] = true;
      component.registerOnChange(onChange);

      component.writeValue('+34678906543');

      expect(onChange).not.toHaveBeenCalled();
    });

    it('should clear the value when writeValue receives null after initialization', () => {
      component['initialized'] = true;
      component.writeValue('+34678906543');
      component.writeValue(null);
      expect(component.fieldControl()?.value).toBe('');
    });

    it('should propagate value changes to the registered onChange callback', () => {
      const onChange = jest.fn();
      component.registerOnChange(onChange);
      component.telForm.get('numberControl')?.setValue('+34678906543');
      expect(onChange).toHaveBeenCalledWith('+34 678 90 65 43');
    });

    it('should call the registered onTouched callback on blur', () => {
      const onTouched = jest.fn();
      component.registerOnTouched(onTouched);
      component.onInputBlur();
      expect(onTouched).toHaveBeenCalled();
    });

    it('should update the disabled model through setDisabledState', () => {
      component.setDisabledState(true);
      expect(component.disabled()).toBe(true);
      component.setDisabledState(false);
      expect(component.disabled()).toBe(false);
    });

    it('should validate the bound control value', () => {
      expect(component.validate(new FormControl('+34678906543'))).toBeNull();
      expect(component.validate(new FormControl('invalid'))).toEqual({
        invalidNumber: true
      });
      expect(component.validate(new FormControl(''))).toBeNull();
    });

    it('should apply required validation to the bound control', () => {
      component.required.set(true);

      expect(component.validate(new FormControl(''))).toEqual({
        required: true
      });
    });

    it('should notify Angular when validation inputs change', () => {
      const validatorChange = jest.fn();
      component.registerOnValidatorChange(validatorChange);

      fixture.componentRef.setInput('numberValidation', false);
      fixture.detectChanges();

      expect(validatorChange).toHaveBeenCalled();
    });

    it('should skip validation when numberValidation is false', () => {
      Object.defineProperty(component, 'numberValidation', {
        value: jest.fn().mockReturnValue(false),
        writable: true
      });
      expect(component.validate(new FormControl('invalid'))).toBeNull();
    });
  });

  describe('setCursorPosition', () => {
    let mockInputElement: HTMLInputElement;
    let mockParsedNumber: any;

    beforeEach(() => {
      mockInputElement = {
        setSelectionRange: jest.fn()
      } as any;
      mockParsedNumber = {
        format: jest.fn().mockReturnValue('123 456 7890')
      };
      jest.spyOn(component as any, 'adjustCursorPosition').mockReturnValue(10);
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should set cursor position after timeout', () => {
      component['setCursorPosition'](
        mockInputElement,
        5,
        mockParsedNumber,
        '12345'
      );

      jest.advanceTimersByTime(1);
      expect(mockInputElement.setSelectionRange).toHaveBeenCalledWith(10, 10);
    });

    it('should return early when numberValidation is false', () => {
      Object.defineProperty(component, 'numberValidation', {
        value: jest.fn().mockReturnValue(false),
        writable: true
      });

      component['setCursorPosition'](
        mockInputElement,
        5,
        mockParsedNumber,
        '12345'
      );

      jest.advanceTimersByTime(1);
      expect(mockInputElement.setSelectionRange).not.toHaveBeenCalled();
      expect(component['adjustCursorPosition']).not.toHaveBeenCalled();
    });

    it('should use international cursor formatting for MP', () => {
      component.prefixCtrl.setValue({
        iso2: 'mp',
        dialCode: '1670'
      } as Country);

      component['setCursorPosition'](
        mockInputElement,
        5,
        mockParsedNumber,
        '12345'
      );

      expect(mockParsedNumber.format).toHaveBeenCalledWith(
        PhoneNumberFormat.INTERNATIONAL
      );
    });
  });

  describe('adjustCursorPosition', () => {
    it('should return new value length when original position is at end', () => {
      const result = component['adjustCursorPosition'](
        5,
        '12345',
        '123 456 789'
      );
      expect(result).toBe(11);
    });

    it('should adjust cursor position based on space count difference', () => {
      const result = component['adjustCursorPosition'](3, '123456', '123 456');
      expect(result).toBe(3);
    });

    it('should ensure cursor position is within bounds', () => {
      const result = component['adjustCursorPosition'](-5, '123', '123456');
      expect(result).toBe(0);
    });

    it('should not exceed new value length', () => {
      const result = component['adjustCursorPosition'](10, '123456789', '123');
      expect(result).toBe(3);
    });
  });

  describe('countSpacesBeforePosition', () => {
    it('should count spaces before position', () => {
      const result = component['countSpacesBeforePosition']('12 34 56', 5);
      expect(result).toBe(1);
    });

    it('should return 0 when no spaces', () => {
      const result = component['countSpacesBeforePosition']('123456', 3);
      expect(result).toBe(0);
    });

    it('should handle position at start', () => {
      const result = component['countSpacesBeforePosition'](' 123', 0);
      expect(result).toBe(0);
    });
  });

  describe('getMaxInputLength', () => {
    beforeEach(() => {
      Object.defineProperty(component, 'includeDialCode', {
        value: jest.fn().mockReturnValue(false),
        writable: true
      });
      Object.defineProperty(component, 'outputNumberFormat', {
        value: jest.fn().mockReturnValue(PhoneNumberFormat.INTERNATIONAL),
        writable: true
      });
    });

    it('should return default fallback when no country code provided', () => {
      expect(component.getMaxInputLength()).toBe(25);
    });

    it('should return the country max length plus a formatting buffer', () => {
      // US example number has 10 national digits (+3 utils buffer), +6 formatting buffer
      expect(component.getMaxInputLength('us')).toBe(19);
    });

    it('should use a larger buffer when the dial code is typed into the input', () => {
      Object.defineProperty(component, 'includeDialCode', {
        value: jest.fn().mockReturnValue(true),
        writable: true
      });
      expect(component.getMaxInputLength('us')).toBe(21);
    });

    it('should add extra space for RFC3966 with includeDialCode', () => {
      Object.defineProperty(component, 'includeDialCode', {
        value: jest.fn().mockReturnValue(true),
        writable: true
      });
      Object.defineProperty(component, 'outputNumberFormat', {
        value: jest.fn().mockReturnValue(PhoneNumberFormat.RFC3966),
        writable: true
      });
      expect(component.getMaxInputLength('us')).toBe(27);
    });

    it('should fall back to a sane default for unknown countries', () => {
      expect(component.getMaxInputLength('xx')).toBe(21); // 15 default + 6 buffer
    });
  });

  describe('accessibility', () => {
    it('should link the number input to the hint/error region', () => {
      const input: HTMLInputElement =
        fixture.nativeElement.querySelector('input[type="tel"]');
      const describedById = component['describedById'];

      expect(input.getAttribute('aria-describedby')).toBe(describedById);
      expect(
        fixture.nativeElement.querySelector(`#${describedById}`)
      ).toBeTruthy();
    });

    it('should give the number input an accessible name when no visible label exists', () => {
      const input: HTMLInputElement =
        fixture.nativeElement.querySelector('input[type="tel"]');
      expect(input.getAttribute('aria-label')).toBe('Phone number');
    });

    it('should hide decorative flags from assistive technology', () => {
      component.prefixCtrl.setValue({
        name: 'Spain',
        iso2: 'es',
        dialCode: '34',
        flagClass: 'country-code__es'
      } as Country);
      fixture.detectChanges();

      const flagContainer = fixture.nativeElement.querySelector(
        '.country-option-flag-container'
      );
      expect(flagContainer?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('main label rendering with appearance', () => {
    const emptyTextLabels = {
      mainLabel: '',
      codePlaceholder: '',
      searchPlaceholderLabel: '',
      noEntriesFoundLabel: '',
      nationalNumberLabel: '',
      hintLabel: '',
      invalidNumberError: '',
      requiredError: '',
      numberTooLongError: ''
    };

    describe('resolvedMainLabel', () => {
      it('should prefer mainLabel input over textLabels.mainLabel', () => {
        fixture.componentRef.setInput('mainLabel', 'Custom label');
        fixture.componentRef.setInput('textLabels', {
          ...emptyTextLabels,
          mainLabel: 'Fallback'
        });
        expect(component.resolvedMainLabel()).toBe('Custom label');
      });

      it('should fall back to textLabels.mainLabel when mainLabel is empty', () => {
        fixture.componentRef.setInput('mainLabel', '');
        fixture.componentRef.setInput('textLabels', {
          ...emptyTextLabels,
          mainLabel: 'Fallback label'
        });
        expect(component.resolvedMainLabel()).toBe('Fallback label');
      });

      it('should be empty when neither mainLabel nor textLabels.mainLabel is set', () => {
        fixture.componentRef.setInput('mainLabel', '');
        fixture.componentRef.setInput('textLabels', emptyTextLabels);
        expect(component.resolvedMainLabel()).toBe('');
      });
    });

    describe('isOutlineWithLabel', () => {
      it('should be true when appearance is outline and a label is resolved', () => {
        fixture.componentRef.setInput('appearance', 'outline');
        fixture.componentRef.setInput('mainLabel', 'Phone');
        expect(component.isOutlineWithLabel()).toBe(true);
      });

      it('should be false when appearance is fill even if a label is resolved', () => {
        fixture.componentRef.setInput('appearance', 'fill');
        fixture.componentRef.setInput('mainLabel', 'Phone');
        expect(component.isOutlineWithLabel()).toBe(false);
      });

      it('should be false when appearance is outline but no label is resolved', () => {
        fixture.componentRef.setInput('appearance', 'outline');
        fixture.componentRef.setInput('mainLabel', '');
        fixture.componentRef.setInput('textLabels', emptyTextLabels);
        expect(component.isOutlineWithLabel()).toBe(false);
      });
    });

    describe('template', () => {
      it('should render the top-level .main-label for fill + label', () => {
        fixture.componentRef.setInput('appearance', 'fill');
        fixture.componentRef.setInput('mainLabel', 'Phone number');
        fixture.detectChanges();

        const topLabel: HTMLElement | null =
          fixture.nativeElement.querySelector('section > .main-label');
        expect(topLabel).toBeTruthy();
        expect(topLabel?.textContent?.trim()).toBe('Phone number');
      });

      it('should not render the top-level .main-label for outline + label', () => {
        fixture.componentRef.setInput('appearance', 'outline');
        fixture.componentRef.setInput('mainLabel', 'Phone number');
        fixture.detectChanges();

        const topLabel = fixture.nativeElement.querySelector(
          'section > .main-label'
        );
        expect(topLabel).toBeFalsy();
      });

      it('should add has-main-label class to the prefix form field for outline + label', () => {
        fixture.componentRef.setInput('appearance', 'outline');
        fixture.componentRef.setInput('mainLabel', 'Phone number');
        fixture.detectChanges();

        const prefixField: HTMLElement =
          fixture.nativeElement.querySelector('.prefix-form-field');
        expect(prefixField.classList.contains('has-main-label')).toBe(true);
      });

      it('should not add has-main-label class for fill + label', () => {
        fixture.componentRef.setInput('appearance', 'fill');
        fixture.componentRef.setInput('mainLabel', 'Phone number');
        fixture.detectChanges();

        const prefixField: HTMLElement =
          fixture.nativeElement.querySelector('.prefix-form-field');
        expect(prefixField.classList.contains('has-main-label')).toBe(false);
      });

      it('should not add has-main-label class for outline + no label', () => {
        fixture.componentRef.setInput('appearance', 'outline');
        fixture.componentRef.setInput('mainLabel', '');
        fixture.componentRef.setInput('textLabels', emptyTextLabels);
        fixture.detectChanges();

        const prefixField: HTMLElement =
          fixture.nativeElement.querySelector('.prefix-form-field');
        expect(prefixField.classList.contains('has-main-label')).toBe(false);
      });

      it('should render the mat-label inside the prefix form field for outline + label', () => {
        fixture.componentRef.setInput('appearance', 'outline');
        fixture.componentRef.setInput('mainLabel', 'Phone number');
        fixture.detectChanges();

        const prefixLabel: HTMLElement | null =
          fixture.nativeElement.querySelector('.prefix-form-field mat-label');
        expect(prefixLabel).toBeTruthy();
        expect(prefixLabel?.textContent?.trim()).toBe('Phone number');
      });

      it('should render the national number label for outline + mainLabel + nationalNumberLabel', () => {
        fixture.componentRef.setInput('appearance', 'outline');
        fixture.componentRef.setInput('mainLabel', 'Phone number');
        fixture.componentRef.setInput('textLabels', {
          ...emptyTextLabels,
          nationalNumberLabel: 'Number'
        });
        fixture.detectChanges();

        const numberLabel: HTMLElement | null =
          fixture.nativeElement.querySelector('.number-form-field mat-label');
        expect(numberLabel).toBeTruthy();
        expect(numberLabel?.textContent?.trim()).toBe('Number');
      });

      it('should omit the national number label by default', () => {
        fixture.componentRef.setInput('appearance', 'outline');
        fixture.componentRef.setInput('mainLabel', 'Phone number');
        fixture.detectChanges();

        const numberLabel = fixture.nativeElement.querySelector(
          '.number-form-field mat-label'
        );
        expect(numberLabel).toBeFalsy();
      });

      it('should render the national number label for fill + nationalNumberLabel', () => {
        fixture.componentRef.setInput('appearance', 'fill');
        fixture.componentRef.setInput('mainLabel', 'Phone number');
        fixture.componentRef.setInput('textLabels', {
          ...emptyTextLabels,
          nationalNumberLabel: 'Number'
        });
        fixture.detectChanges();

        const numberLabel: HTMLElement | null =
          fixture.nativeElement.querySelector('.number-form-field mat-label');
        expect(numberLabel).toBeTruthy();
        expect(numberLabel?.textContent?.trim()).toBe('Number');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing numberInput element', () => {
      component.numberInput = jest.fn().mockReturnValue(null) as any;
      expect(() =>
        component['startPrefixValueChangesListener']()
      ).not.toThrow();
    });

    it('should handle empty allCountries array', () => {
      component.allCountries.set([]);
      component['setAutoSelectedCountry']();
      expect(component.prefixCtrl.value).toBeUndefined();
    });

    it('should handle phone number parsing errors', () => {
      component.telForm = {
        get: jest.fn().mockReturnValue({ setValue: jest.fn() })
      } as any;
      component.fieldControl.set(new FormControl());

      Object.defineProperty(component, 'initialValue', {
        value: jest.fn().mockReturnValue('invalid-phone-number'),
        writable: true
      });

      expect(() => component['setInitialTelValue']()).not.toThrow();
      expect(component.isLoading()).toBe(false);
    });
  });
});
