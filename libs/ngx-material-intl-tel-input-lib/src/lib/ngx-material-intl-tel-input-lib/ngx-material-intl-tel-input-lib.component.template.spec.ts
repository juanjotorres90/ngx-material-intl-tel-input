import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlContainer, FormControl } from '@angular/forms';
import { of } from 'rxjs';
import { NgxMaterialIntlTelInputComponent } from './ngx-material-intl-tel-input-lib.component';
import { Country } from '../types/country.model';
import { GeoData } from '../types/geo.type';
import { GeoIpService } from '../services/geo-ip/geo-ip.service';

// Template-level rendering split out of the component spec: everything here
// asserts on the rendered DOM rather than on component state.
describe('NgxMaterialIntlTelInputComponent rendering', () => {
  let component: NgxMaterialIntlTelInputComponent;
  let fixture: ComponentFixture<NgxMaterialIntlTelInputComponent>;
  const geoIpServiceMock = {
    geoIpLookup: vi.fn().mockReturnValue(of({} as GeoData))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxMaterialIntlTelInputComponent],
      providers: [
        ControlContainer,
        { provide: GeoIpService, useValue: geoIpServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NgxMaterialIntlTelInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (component) {
      component.ngOnDestroy();
    }
    fixture?.destroy();
    vi.clearAllMocks();
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

  describe('template branch rendering', () => {
    const spain: Country = {
      emojiFlag: '🇪🇸',
      name: 'Spain (España)',
      iso2: 'es',
      dialCode: '34',
      priority: 0,
      htmlId: 'country-code__es',
      flagClass: 'country-code__es',
      placeHolder: '612 34 56 78'
    } as Country;

    it('should toggle the focused class on input focus and blur', () => {
      const input: HTMLInputElement =
        fixture.nativeElement.querySelector('input[type="tel"]');

      input.dispatchEvent(new Event('focus'));
      fixture.detectChanges();
      expect(component.isFocused()).toBe(true);
      expect(
        fixture.nativeElement
          .querySelector('.tel-form')
          .classList.contains('is-focused')
      ).toBe(true);

      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(component.isFocused()).toBe(false);
    });

    it('should render emoji flags in the trigger and options when emojiFlags is enabled', () => {
      fixture.componentRef.setInput('emojiFlags', true);
      component.prefixCtrl.setValue(spain);
      component.isLoading.set(false);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.flag-emoji')).toBeTruthy();

      component.singleSelect()?.open();
      fixture.detectChanges();

      expect(document.querySelectorAll('.flag-emoji').length).toBeGreaterThan(
        1
      );
    });

    it('should show the ISO code in the trigger when includeDialCode is enabled', () => {
      fixture.componentRef.setInput('includeDialCode', true);
      component.prefixCtrl.setValue(spain);
      component.isLoading.set(false);
      fixture.detectChanges();

      const trigger: HTMLElement =
        fixture.nativeElement.querySelector('.country-option');
      expect(trigger.textContent).toContain('ES');
    });

    it('should show the dial code for MP when includeDialCode is disabled', () => {
      const northernMarianaIslands = component.allCountries.find(
        (country) => country.iso2 === 'mp'
      );
      component.prefixCtrl.setValue(northernMarianaIslands ?? null);
      component.isLoading.set(false);
      fixture.detectChanges();

      const trigger: HTMLElement =
        fixture.nativeElement.querySelector('.country-option');
      expect(trigger.textContent).toContain('+1');
      expect(trigger.textContent).not.toContain('MP');
    });

    it('should render an empty trigger when the selected country has no ISO code', async () => {
      const noIsoCountry = { dialCode: '34', iso2: '' } as Country;
      component.filteredCountries.next([noIsoCountry]);
      fixture.componentRef.setInput('includeDialCode', true);
      component.prefixCtrl.setValue(noIsoCountry);
      component.isLoading.set(false);
      fixture.detectChanges();
      // mat-select re-initializes its selection in a microtask after the
      // options list changes
      await Promise.resolve();
      fixture.detectChanges();

      const trigger: HTMLElement =
        fixture.nativeElement.querySelector('.country-option');
      expect(trigger.textContent?.trim()).toBe('');
    });

    it('should resolve the number input element through the view child signal', () => {
      expect(component.numberInput()?.nativeElement).toBeInstanceOf(
        HTMLInputElement
      );
    });

    it('should not render the country search when enableSearch is disabled', () => {
      fixture.componentRef.setInput('enableSearch', false);
      fixture.detectChanges();

      component.singleSelect()?.open();
      fixture.detectChanges();

      expect(document.querySelector('ngx-mat-select-search')).toBeFalsy();
    });

    it('should hide the phone icon when hidePhoneIcon is enabled', () => {
      fixture.componentRef.setInput('hidePhoneIcon', true);
      fixture.detectChanges();

      expect(
        fixture.nativeElement.querySelector('.number-form-field mat-icon')
      ).toBeFalsy();
    });

    it('should render a tel link when the field control holds a valid value', () => {
      component.telForm.get('numberControl')?.setValue('+34678906543');
      fixture.detectChanges();

      const link: HTMLAnchorElement | null =
        fixture.nativeElement.querySelector('a[href^="tel:"]');
      expect(link).toBeTruthy();
    });

    it('should render the required error when the control is dirty', () => {
      const fc = new FormControl('');
      fc.markAsDirty();
      component.fieldControl.set(fc);
      component.required.set(true);
      fixture.detectChanges();

      const error: HTMLElement | null =
        fixture.nativeElement.querySelector('mat-error');
      expect(error?.textContent).toContain('This field is required');
    });

    it('should render the invalid number error', () => {
      const fc = new FormControl('123', () => ({ invalidNumber: true }));
      component.fieldControl.set(fc);
      fixture.detectChanges();

      const error: HTMLElement | null =
        fixture.nativeElement.querySelector('mat-error');
      expect(error?.textContent).toContain('Number is not valid');
    });

    it('should render the number too long error', () => {
      const fc = new FormControl('123456789012345678', () => ({
        numberTooLong: true
      }));
      component.fieldControl.set(fc);
      fixture.detectChanges();

      const error: HTMLElement | null =
        fixture.nativeElement.querySelector('mat-error');
      expect(error?.textContent).toContain('Phone number is too long');
    });

    it('should show the code placeholder once loading has finished', () => {
      component.isLoading.set(false);
      fixture.detectChanges();

      const select: HTMLElement =
        fixture.nativeElement.querySelector('mat-select');
      expect(
        select.getAttribute('aria-label') ?? select.textContent
      ).toBeDefined();
      expect(component.singleSelect()?.placeholder).toBe('Code');
    });
  });
});
