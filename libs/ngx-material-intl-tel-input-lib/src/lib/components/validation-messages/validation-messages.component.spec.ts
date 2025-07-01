import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { ValidationMessagesComponent } from './validation-messages.component';
import { TextLabels } from '../../types/text-labels.type';

describe('ValidationMessagesComponent', () => {
  let component: ValidationMessagesComponent;
  let fixture: ComponentFixture<ValidationMessagesComponent>;

  const mockTextLabels: TextLabels = {
    hintLabel: 'Enter your phone number',
    requiredError: 'Phone number is required',
    invalidNumberError: 'Invalid phone number',
    numberTooLongError: 'Phone number is too long',
    mainLabel: 'Phone',
    codePlaceholder: 'Country',
    searchPlaceholderLabel: 'Search',
    noEntriesFoundLabel: 'No results',
    nationalNumberLabel: 'Number'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidationMessagesComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ValidationMessagesComponent);
    component = fixture.componentInstance;

    // Set required inputs
    fixture.componentRef.setInput('textLabels', mockTextLabels);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show hint when showHint is true and hintLabel exists', () => {
    fixture.componentRef.setInput('showHint', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const hint = compiled.querySelector('mat-hint');
    expect(hint?.textContent?.trim()).toBe('Enter your phone number');
  });

  it('should not show hint when showHint is false', () => {
    fixture.componentRef.setInput('showHint', false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const hint = compiled.querySelector('mat-hint');
    expect(hint).toBeFalsy();
  });

  it('should show required error when field is required and dirty', () => {
    const control = new FormControl('', Validators.required);
    control.markAsDirty();
    control.updateValueAndValidity();

    fixture.componentRef.setInput('fieldControl', control);
    fixture.detectChanges();

    expect(component.shouldShowRequiredError()).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    const error = compiled.querySelector('mat-error');
    expect(error?.textContent?.trim()).toBe('Phone number is required');
  });

  it('should show invalid number error when field has invalidNumber error', () => {
    const control = new FormControl('');
    control.setErrors({ invalidNumber: true });

    fixture.componentRef.setInput('fieldControl', control);
    fixture.detectChanges();

    expect(component.shouldShowInvalidNumberError()).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    const error = compiled.querySelector('mat-error');
    expect(error?.textContent?.trim()).toBe('Invalid phone number');
  });

  it('should show number too long error when field has numberTooLong error', () => {
    const control = new FormControl('');
    control.setErrors({ numberTooLong: true });

    fixture.componentRef.setInput('fieldControl', control);
    fixture.detectChanges();

    expect(component.shouldShowNumberTooLongError()).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    const error = compiled.querySelector('mat-error');
    expect(error?.textContent?.trim()).toBe('Phone number is too long');
  });

  it('should return all error messages', () => {
    const control = new FormControl('');
    control.setErrors({
      invalidNumber: true,
      numberTooLong: true
    });

    fixture.componentRef.setInput('fieldControl', control);
    fixture.detectChanges();

    const errorMessages = component.getErrorMessages();
    expect(errorMessages).toContain('Invalid phone number');
    expect(errorMessages).toContain('Phone number is too long');
    expect(errorMessages.length).toBe(2);
  });

  it('should detect if there are any errors', () => {
    const control = new FormControl('');
    control.setErrors({ invalidNumber: true });

    fixture.componentRef.setInput('fieldControl', control);
    fixture.detectChanges();

    expect(component.hasErrors()).toBe(true);
  });

  it('should detect no errors when control is valid', () => {
    const control = new FormControl('valid-value');

    fixture.componentRef.setInput('fieldControl', control);
    fixture.detectChanges();

    expect(component.hasErrors()).toBe(false);
  });

  describe('Edge Cases and Branch Coverage', () => {
    it('should handle null fieldControl gracefully', () => {
      fixture.componentRef.setInput('fieldControl', null);
      fixture.detectChanges();

      expect(component.shouldShowRequiredError()).toBe(false);
      expect(component.shouldShowInvalidNumberError()).toBe(false);
      expect(component.shouldShowNumberTooLongError()).toBe(false);
      expect(component.hasErrors()).toBe(false);
      expect(component.getErrorMessages()).toEqual([]);
    });

    it('should handle undefined textLabels gracefully', () => {
      const control = new FormControl('', Validators.required);
      control.markAsDirty();
      control.updateValueAndValidity();

      fixture.componentRef.setInput('fieldControl', control);
      fixture.componentRef.setInput('textLabels', undefined);
      fixture.detectChanges();

      expect(component.shouldShowRequiredError()).toBe(false);
      expect(component.getErrorMessages()).toEqual([]);
    });

    it('should handle empty textLabels object', () => {
      const control = new FormControl('', Validators.required);
      control.markAsDirty();
      control.setErrors({ invalidNumber: true, numberTooLong: true });

      fixture.componentRef.setInput('fieldControl', control);
      fixture.componentRef.setInput('textLabels', {});
      fixture.detectChanges();

      expect(component.shouldShowRequiredError()).toBe(false);
      expect(component.shouldShowInvalidNumberError()).toBe(false);
      expect(component.shouldShowNumberTooLongError()).toBe(false);
      expect(component.getErrorMessages()).toEqual([]);
    });

    it('should not show required error when field is not dirty', () => {
      const control = new FormControl('', Validators.required);
      control.updateValueAndValidity(); // Trigger validation but don't mark as dirty

      fixture.componentRef.setInput('fieldControl', control);
      fixture.detectChanges();

      expect(component.shouldShowRequiredError()).toBe(false);
    });

    it('should not show errors when control has no errors', () => {
      const control = new FormControl('valid-value');

      fixture.componentRef.setInput('fieldControl', control);
      fixture.detectChanges();

      expect(component.shouldShowRequiredError()).toBe(false);
      expect(component.shouldShowInvalidNumberError()).toBe(false);
      expect(component.shouldShowNumberTooLongError()).toBe(false);
      expect(component.hasErrors()).toBe(false);
    });

    it('should handle partial textLabels with missing error messages', () => {
      const control = new FormControl('');
      control.setErrors({
        required: true,
        invalidNumber: true,
        numberTooLong: true
      });
      control.markAsDirty();

      fixture.componentRef.setInput('fieldControl', control);
      fixture.componentRef.setInput('textLabels', {
        requiredError: 'Required field'
        // Missing invalidNumberError and numberTooLongError
      });
      fixture.detectChanges();

      expect(component.shouldShowRequiredError()).toBe(true);
      expect(component.shouldShowInvalidNumberError()).toBe(false);
      expect(component.shouldShowNumberTooLongError()).toBe(false);

      const errorMessages = component.getErrorMessages();
      expect(errorMessages).toEqual(['Required field']);
      expect(errorMessages.length).toBe(1);
    });

    it('should show hint when showHint is true and hintLabel is provided', () => {
      fixture.componentRef.setInput('showHint', true);
      fixture.componentRef.setInput('textLabels', {
        hintLabel: 'Enter your phone number'
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const hint = compiled.querySelector('mat-hint');
      expect(hint?.textContent?.trim()).toBe('Enter your phone number');
    });

    it('should not show hint when showHint is false', () => {
      fixture.componentRef.setInput('showHint', false);
      fixture.componentRef.setInput('textLabels', {
        hintLabel: 'Enter your phone number'
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const hint = compiled.querySelector('mat-hint');
      expect(hint).toBeNull();
    });

    it('should not show hint when hintLabel is not provided', () => {
      fixture.componentRef.setInput('showHint', true);
      fixture.componentRef.setInput('textLabels', {});
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const hint = compiled.querySelector('mat-hint');
      expect(hint).toBeNull();
    });

    it('should handle control with multiple error types simultaneously', () => {
      const control = new FormControl('');
      control.setErrors({
        required: true,
        invalidNumber: true,
        numberTooLong: true
      });
      control.markAsDirty();

      fixture.componentRef.setInput('fieldControl', control);
      fixture.detectChanges();

      expect(component.shouldShowRequiredError()).toBe(true);
      expect(component.shouldShowInvalidNumberError()).toBe(true);
      expect(component.shouldShowNumberTooLongError()).toBe(true);
      expect(component.hasErrors()).toBe(true);

      const errorMessages = component.getErrorMessages();
      expect(errorMessages.length).toBe(3);
      expect(errorMessages).toContain('Phone number is required');
      expect(errorMessages).toContain('Invalid phone number');
      expect(errorMessages).toContain('Phone number is too long');
    });
  });
});
