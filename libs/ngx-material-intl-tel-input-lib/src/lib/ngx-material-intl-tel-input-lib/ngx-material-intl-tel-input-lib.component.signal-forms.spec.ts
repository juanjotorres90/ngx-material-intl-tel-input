import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  disabled,
  form,
  FormField,
  required,
  validate
} from '@angular/forms/signals';
import { of } from 'rxjs';
import { NgxMaterialIntlTelInputComponent } from './ngx-material-intl-tel-input-lib.component';
import { GeoData } from '../types/geo.type';
import { GeoIpService } from '../services/geo-ip/geo-ip.service';
import { validPhoneNumber } from '../validators/tel-signal.validators';

@Component({
  imports: [NgxMaterialIntlTelInputComponent, FormField],
  template: `<ngx-material-intl-tel-input
    [formField]="phoneForm.phone"
    [autoSelectCountry]="false"
  />`
})
class SignalFormsHostComponent {
  telInput = viewChild.required(NgxMaterialIntlTelInputComponent);
  model = signal({ phone: '' });
  phoneForm = form(this.model, (path) => {
    required(path.phone);
    validate(path.phone, validPhoneNumber);
  });
}

@Component({
  imports: [NgxMaterialIntlTelInputComponent, FormField],
  template: `<ngx-material-intl-tel-input
    [formField]="phoneForm.phone"
    [autoSelectCountry]="false"
  />`
})
class PrepopulatedSignalFormsHostComponent {
  telInput = viewChild.required(NgxMaterialIntlTelInputComponent);
  model = signal({ phone: '+41446681800' });
  phoneForm = form(this.model, (path) => {
    validate(path.phone, validPhoneNumber);
  });
}

@Component({
  imports: [NgxMaterialIntlTelInputComponent, FormField],
  template: `<ngx-material-intl-tel-input [formField]="phoneForm.phone" />`
})
class DisabledSignalFormsHostComponent {
  telInput = viewChild.required(NgxMaterialIntlTelInputComponent);
  model = signal({ phone: '' });
  phoneForm = form(this.model, (path) => {
    disabled(path.phone);
  });
}

describe('NgxMaterialIntlTelInputComponent with Signal Forms', () => {
  let hostFixture: ComponentFixture<SignalFormsHostComponent>;
  let host: SignalFormsHostComponent;
  const geoIpServiceMock = {
    geoIpLookup: vi.fn().mockReturnValue(of({} as GeoData))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SignalFormsHostComponent,
        PrepopulatedSignalFormsHostComponent,
        DisabledSignalFormsHostComponent
      ],
      providers: [{ provide: GeoIpService, useValue: geoIpServiceMock }]
    }).compileComponents();

    hostFixture = TestBed.createComponent(SignalFormsHostComponent);
    host = hostFixture.componentInstance;
    hostFixture.detectChanges();
  });

  afterEach(() => {
    hostFixture?.destroy();
    vi.clearAllMocks();
  });

  it('should create when bound via the formField directive without a ControlContainer', () => {
    expect(host.telInput()).toBeTruthy();
  });

  it('should propagate a field value set on the form into the component', async () => {
    host.phoneForm.phone().value.set('+34612345678');
    hostFixture.detectChanges();
    await hostFixture.whenStable();
    hostFixture.detectChanges();

    expect(host.telInput().fieldControl()?.value).toBe('+34 612 34 56 78');
  });

  it('should repaint the country selector and number input when the field value is set on the form', async () => {
    host.phoneForm.phone().value.set('+34612345678');
    hostFixture.detectChanges();
    await hostFixture.whenStable();
    hostFixture.detectChanges();

    const telInput = host.telInput();
    expect(telInput.prefixCtrl.value?.iso2).toBe('es');
    expect(telInput.telForm.get('numberControl')?.value).toBe('612 34 56 78');
  });

  it('should populate the input and country from a pre-populated form model on init', async () => {
    const prepopulatedFixture = TestBed.createComponent(
      PrepopulatedSignalFormsHostComponent
    );
    prepopulatedFixture.detectChanges();
    await prepopulatedFixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    prepopulatedFixture.detectChanges();

    const telInput = prepopulatedFixture.componentInstance.telInput();
    expect(telInput.prefixCtrl.value?.iso2).toBe('ch');
    expect(telInput.telForm.get('numberControl')?.value).toBe('044 668 18 00');
    expect(telInput.fieldControl()?.value).toBe('+41 44 668 18 00');
    expect(
      prepopulatedFixture.componentInstance.phoneForm.phone().valid()
    ).toBe(true);
    prepopulatedFixture.destroy();
  });

  it('should propagate typed input back into the form model', async () => {
    const telInput = host.telInput();
    const spain = telInput.allCountries.find((c) => c.iso2 === 'es');
    telInput.prefixCtrl.setValue(spain ?? null);
    telInput.telForm.get('numberControl')?.setValue('612345678');
    hostFixture.detectChanges();
    await hostFixture.whenStable();

    expect(host.model().phone).toBe('+34 612 34 56 78');
    expect(host.phoneForm.phone().valid()).toBe(true);
  });

  it('should mark the field as invalid for an invalid phone number', async () => {
    host.phoneForm.phone().value.set('+34 123');
    hostFixture.detectChanges();
    await hostFixture.whenStable();

    expect(host.phoneForm.phone().invalid()).toBe(true);
    expect(
      host.phoneForm
        .phone()
        .errors()
        .some((error) => error.kind === 'invalidNumber')
    ).toBe(true);
  });

  it('should mark the field as touched on input blur', async () => {
    expect(host.phoneForm.phone().touched()).toBe(false);
    host.telInput().onInputBlur();
    hostFixture.detectChanges();
    await hostFixture.whenStable();

    expect(host.phoneForm.phone().touched()).toBe(true);
  });

  it('should mark the field as dirty when the user types a number', async () => {
    expect(host.phoneForm.phone().dirty()).toBe(false);
    const telInput = host.telInput();
    const spain = telInput.allCountries.find((c) => c.iso2 === 'es');
    telInput.prefixCtrl.setValue(spain ?? null);
    telInput.telForm.get('numberControl')?.setValue('612345678');
    hostFixture.detectChanges();
    await hostFixture.whenStable();

    expect(host.phoneForm.phone().dirty()).toBe(true);
  });

  it('should stay consistent through alternating external writes and typed input', async () => {
    const telInput = host.telInput();

    host.phoneForm.phone().value.set('+34612345678');
    hostFixture.detectChanges();
    await hostFixture.whenStable();

    host.phoneForm.phone().value.set('+41446681800');
    hostFixture.detectChanges();
    await hostFixture.whenStable();
    hostFixture.detectChanges();

    expect(telInput.prefixCtrl.value?.iso2).toBe('ch');
    expect(telInput.telForm.get('numberControl')?.value).toBe('044 668 18 00');

    telInput.telForm.get('numberControl')?.setValue('446681801');
    hostFixture.detectChanges();
    await hostFixture.whenStable();

    expect(host.model().phone).toBe('+41 44 668 18 01');
    expect(telInput.fieldControl()?.value).toBe('+41 44 668 18 01');
  });

  it('should disable the component when the schema disables the field', async () => {
    const disabledFixture = TestBed.createComponent(
      DisabledSignalFormsHostComponent
    );
    disabledFixture.detectChanges();
    await disabledFixture.whenStable();

    expect(disabledFixture.componentInstance.telInput().disabled()).toBe(true);
    expect(disabledFixture.componentInstance.telInput().telForm.disabled).toBe(
      true
    );
    disabledFixture.destroy();
  });
});
