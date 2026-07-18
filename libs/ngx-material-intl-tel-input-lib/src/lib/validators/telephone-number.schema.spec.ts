import { Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { apply, form, required } from '@angular/forms/signals';
import { telephoneNumberSchema } from './telephone-number.schema';

describe('telephoneNumberSchema', () => {
  const createPhoneForm = (requiredPhone = false) => {
    const model = signal({ phone: '' });
    const phoneForm = form(
      model,
      (path) => {
        if (requiredPhone) {
          required(path.phone);
        }
        apply(
          path.phone,
          telephoneNumberSchema({
            messages: { invalidNumber: 'Invalid telephone number' }
          })
        );
      },
      { injector: TestBed.inject(Injector) }
    );
    return { model, phoneForm };
  };

  it('allows an empty optional telephone number', () => {
    const { phoneForm } = createPhoneForm();

    expect(phoneForm.phone().valid()).toBe(true);
  });

  it('composes with the required rule', () => {
    const { phoneForm } = createPhoneForm(true);

    expect(phoneForm.phone().errors()).toEqual([
      expect.objectContaining({ kind: 'required' })
    ]);
  });

  it('accepts a valid international telephone number', () => {
    const { model, phoneForm } = createPhoneForm();

    model.set({ phone: '+34 612 34 56 78' });

    expect(phoneForm.phone().valid()).toBe(true);
  });

  it('returns the configured message for an invalid number', () => {
    const { model, phoneForm } = createPhoneForm();

    model.set({ phone: 'invalid' });

    expect(phoneForm.phone().errors()).toEqual([
      expect.objectContaining({
        kind: 'invalidNumber',
        message: 'Invalid telephone number'
      })
    ]);
  });
});
