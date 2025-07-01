import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PhoneNumberInputComponent } from './phone-number-input.component';
import { Country } from '../../types/country.model';

describe('PhoneNumberInputComponent', () => {
  let component: PhoneNumberInputComponent;
  let fixture: ComponentFixture<PhoneNumberInputComponent>;

  const mockCountry: Country = {
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhoneNumberInputComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(PhoneNumberInputComponent);
    component = fixture.componentInstance;

    // Set required inputs
    fixture.componentRef.setInput('selectedCountry', mockCountry);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial empty phone number', () => {
    expect(component.phoneNumber()).toBe('');
  });

  it('should emit focused event when input is focused', () => {
    jest.spyOn(component.focused, 'emit');

    component.onFocus();

    expect(component.focused.emit).toHaveBeenCalled();
  });

  it('should emit blurred event when input is blurred', () => {
    jest.spyOn(component.blurred, 'emit');

    component.onBlur();

    expect(component.blurred.emit).toHaveBeenCalled();
  });

  it('should emit value change when number control value changes', () => {
    jest.spyOn(component.valueChanged, 'emit');

    component.numberControl.setValue('123456789');

    expect(component.valueChanged.emit).toHaveBeenCalledWith('123456789');
    expect(component.phoneNumber()).toBe('123456789');
  });

  it('should show phone icon by default', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const phoneIcon = compiled.querySelector('svg');
    expect(phoneIcon).toBeTruthy();
  });

  it('should hide phone icon when hidePhoneIcon is true', () => {
    fixture.componentRef.setInput('hidePhoneIcon', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const matIcon = compiled.querySelector('mat-icon');
    expect(matIcon).toBeFalsy();
  });

  it('should display placeholder from selected country', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('input') as HTMLInputElement;
    expect(input.placeholder).toBe(mockCountry.placeHolder);
  });

  it('should set maxlength attribute when maxLength is provided', () => {
    fixture.componentRef.setInput('maxLength', 15);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('maxlength')).toBe('15');
  });

  it('should make input required when required is true', () => {
    fixture.componentRef.setInput('required', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('input') as HTMLInputElement;
    expect(input.required).toBe(true);
  });

  it('should show label when nationalNumberLabel is provided', () => {
    fixture.componentRef.setInput('textLabels', {
      nationalNumberLabel: 'Phone Number'
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const label = compiled.querySelector('mat-label');
    expect(label?.textContent?.trim()).toBe('Phone Number');
  });

  describe('Input Element Methods', () => {
    it('should get input element', () => {
      const inputElement = component.getInputElement();
      expect(inputElement).toBeTruthy();
      expect(inputElement?.tagName).toBe('INPUT');
    });

    it('should return null when numberInput is not available', () => {
      // Mock numberInput to return undefined
      jest.spyOn(component, 'numberInput').mockReturnValue(undefined);

      const inputElement = component.getInputElement();
      expect(inputElement).toBeNull();
    });

    it('should focus the input element', () => {
      const mockInput = { focus: jest.fn() };
      jest
        .spyOn(component, 'getInputElement')
        .mockReturnValue(mockInput as any);

      component.focus();
      expect(mockInput.focus).toHaveBeenCalled();
    });

    it('should not focus when input element is null', () => {
      jest.spyOn(component, 'getInputElement').mockReturnValue(null);

      expect(() => component.focus()).not.toThrow();
    });

    it('should set cursor position', () => {
      const mockInput = { setSelectionRange: jest.fn() };
      jest
        .spyOn(component, 'getInputElement')
        .mockReturnValue(mockInput as any);

      component.setCursorPosition(5);
      expect(mockInput.setSelectionRange).toHaveBeenCalledWith(5, 5);
    });

    it('should not set cursor position when input element is null', () => {
      jest.spyOn(component, 'getInputElement').mockReturnValue(null);

      expect(() => component.setCursorPosition(5)).not.toThrow();
    });

    it('should get cursor position', () => {
      const mockInput = { selectionStart: 3 };
      jest
        .spyOn(component, 'getInputElement')
        .mockReturnValue(mockInput as any);

      const position = component.getCursorPosition();
      expect(position).toBe(3);
    });

    it('should return 0 when input element is null', () => {
      jest.spyOn(component, 'getInputElement').mockReturnValue(null);

      const position = component.getCursorPosition();
      expect(position).toBe(0);
    });

    it('should return 0 when selectionStart is null', () => {
      const mockInput = { selectionStart: null };
      jest
        .spyOn(component, 'getInputElement')
        .mockReturnValue(mockInput as any);

      const position = component.getCursorPosition();
      expect(position).toBe(0);
    });
  });
});
