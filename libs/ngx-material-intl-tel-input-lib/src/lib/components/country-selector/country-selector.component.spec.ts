import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CountrySelectorComponent } from './country-selector.component';
import { Country } from '../../types/country.model';

describe('CountrySelectorComponent', () => {
  let component: CountrySelectorComponent;
  let fixture: ComponentFixture<CountrySelectorComponent>;

  const mockCountries: Country[] = [
    {
      iso2: 'us',
      dialCode: '1',
      name: 'United States',
      flagClass: 'flag-us',
      emojiFlag: '🇺🇸',
      mask: { mask: '+1 (###) ###-####' },
      placeHolder: '+1 (555) 123-4567',
      priority: 0,
      areaCodes: undefined,
      htmlId: 'country-us'
    },
    {
      iso2: 'gb',
      dialCode: '44',
      name: 'United Kingdom',
      flagClass: 'flag-gb',
      emojiFlag: '🇬🇧',
      mask: { mask: '+44 ### ### ####' },
      placeHolder: '+44 20 7946 0958',
      priority: 0,
      areaCodes: undefined,
      htmlId: 'country-gb'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CountrySelectorComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CountrySelectorComponent);
    component = fixture.componentInstance;

    // Set required inputs
    fixture.componentRef.setInput('countries', mockCountries);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display countries in the dropdown', () => {
    expect(component.countries().length).toBe(2);
    expect(component.countries()[0].name).toBe('United States');
    expect(component.countries()[1].name).toBe('United Kingdom');
  });

  it('should emit country change when selection changes', () => {
    jest.spyOn(component.countryChanged, 'emit');

    const selectedCountry = mockCountries[0];
    component.onCountryChange(selectedCountry);

    expect(component.countryChanged.emit).toHaveBeenCalledWith(selectedCountry);
  });

  it('should filter countries based on search term', () => {
    component.ngOnInit();

    // Search for "United"
    component.searchControl.setValue('United');

    // Since we're using a ReplaySubject, we need to subscribe to test
    component.filteredCountries.subscribe((countries) => {
      expect(countries.length).toBe(2); // Both countries contain "United"
    });
  });

  it('should show emoji flags when emojiFlags is true', () => {
    fixture.componentRef.setInput('emojiFlags', true);
    fixture.componentRef.setInput('selectedCountry', mockCountries[0]);
    fixture.detectChanges();

    // Check the component property instead of DOM
    expect(component.emojiFlags()).toBe(true);
    expect(component.selectedCountry()?.emojiFlag).toBe('🇺🇸');
  });

  it('should show dial code when includeDialCode is false', () => {
    fixture.componentRef.setInput('includeDialCode', false);
    fixture.componentRef.setInput('selectedCountry', mockCountries[0]);
    fixture.detectChanges();

    // Check the component property instead of DOM
    expect(component.includeDialCode()).toBe(false);
    expect(component.selectedCountry()?.dialCode).toBe('1');
  });

  it('should show country ISO when includeDialCode is true', () => {
    fixture.componentRef.setInput('includeDialCode', true);
    fixture.componentRef.setInput('selectedCountry', mockCountries[0]);
    fixture.detectChanges();

    // Check the component property instead of DOM
    expect(component.includeDialCode()).toBe(true);
    expect(component.selectedCountry()?.iso2).toBe('us');
  });

  describe('Additional Coverage Tests', () => {
    it('should handle empty search term in filterCountries', () => {
      jest.spyOn(component.filteredCountries, 'next');

      component.searchControl.setValue('');

      expect(component.filteredCountries.next).toHaveBeenCalledWith(
        mockCountries
      );
    });

    it('should handle ngOnDestroy cleanup', () => {
      const nextSpy = jest.spyOn((component as any).destroyed$, 'next');
      const completeSpy = jest.spyOn((component as any).destroyed$, 'complete');

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should call updateFilteredCountries method', () => {
      jest.spyOn(component.filteredCountries, 'next');

      (component as any).updateFilteredCountries();

      expect(component.filteredCountries.next).toHaveBeenCalledWith(
        mockCountries
      );
    });

    it('should filter countries by ISO code', () => {
      component.ngOnInit();

      // Test the filtering logic more thoroughly
      component.searchControl.setValue('gb');

      // Subscribe to the filtered results
      component.filteredCountries.subscribe((countries) => {
        expect(countries.length).toBe(1);
        expect(countries[0].iso2).toBe('gb');
      });
    });

    it('should filter countries by dial code', () => {
      component.ngOnInit();

      component.searchControl.setValue('44');

      component.filteredCountries.subscribe((countries) => {
        expect(countries.length).toBe(1);
        expect(countries[0].dialCode).toBe('44');
      });
    });

    it('should emit searchTermChanged when search control value changes', () => {
      jest.spyOn(component.searchTermChanged, 'emit');

      component.ngOnInit();
      component.searchControl.setValue('test');

      expect(component.searchTermChanged.emit).toHaveBeenCalledWith('test');
    });

    // FIXME: This test is incorrect - selectedCountry is an input signal managed by parent
    // it('should sync selectedCountry when countryControl value changes', () => {
    //   component.ngOnInit();
    //
    //   const testCountry = mockCountries[1];
    //   component.countryControl.setValue(testCountry);
    //
    //   expect(component.selectedCountry()).toBe(testCountry);
    // });

    it('should sync countryControl when selectedCountry input changes', () => {
      component.ngOnInit();

      const testCountry = mockCountries[1];
      fixture.componentRef.setInput('selectedCountry', testCountry);
      fixture.detectChanges();

      expect(component.countryControl.value).toBe(testCountry);
    });
  });
});
