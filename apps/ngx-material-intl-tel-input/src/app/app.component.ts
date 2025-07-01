import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { PhoneNumberFormat } from 'google-libphonenumber';
import {
  NgxMaterialIntlTelInputComponent,
  NgxMaterialIntlTelInputRefactoredComponent
} from 'ngx-material-intl-tel-input';

@Component({
  imports: [
    NgxMaterialIntlTelInputComponent,
    NgxMaterialIntlTelInputRefactoredComponent,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatTabsModule,
    MatCardModule
  ],
  selector: 'ngx-material-intl-tel-input-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  private readonly fb = inject(FormBuilder);
  title = 'ngx-material-intl-tel-input';
  currentPhoneValue = signal<string>('');
  currentCountryCode = signal<string>('');
  currentCountryISO = signal<string>('');
  submittedPhoneValue = signal<string>('');
  formTestGroup: FormGroup;
  showSetPhoneInput = signal<boolean>(false);
  PhoneNumberFormat = PhoneNumberFormat;

  // State for refactored component
  currentPhoneValueRefactored = signal<string>('');
  currentCountryCodeRefactored = signal<string>('');
  currentCountryISORefactored = signal<string>('');
  submittedPhoneValueRefactored = signal<string>('');
  formTestGroupRefactored: FormGroup;
  showSetPhoneInputRefactored = signal<boolean>(false);

  constructor() {
    this.formTestGroup = this.fb.group({
      phone: ['', [Validators.required]],
      setPhoneTextbox: ['']
    });

    this.formTestGroupRefactored = this.fb.group({
      phoneRefactored: ['', [Validators.required]],
      setPhoneTextboxRefactored: ['']
    });
  }

  /**
   * Sets the current phone value to the provided value.
   *
   * @param value - The new value for the current phone.
   */
  getValue(value: string): void {
    this.currentPhoneValue.set(value);
  }

  /**
   * Submits the form data by setting the submitted phone value to the current phone value from the form group.
   */
  onSubmit(): void {
    this.submittedPhoneValue.set(this.formTestGroup.value['phone']);
  }

  /**
   * Sets the phone control value to the value entered in the 'setPhoneTextbox' control.
   */
  setPhone(): void {
    this.formTestGroup.controls['phone'].setValue(
      this.formTestGroup.value['setPhoneTextbox']
    );
  }

  /**
   * Toggles the visibility of the set phone input field.
   */
  toggleShowSetPhoneInput(): void {
    this.showSetPhoneInput.set(!this.showSetPhoneInput());
  }

  /**
   * Sets the current country code to the provided value.
   *
   * @param value - The new country code to set.
   */
  getCountryCode(value: string): void {
    this.currentCountryCode.set(value);
  }

  /**
   * Sets the current country ISO code to the provided value.
   *
   * @param value - The new ISO code to set.
   */
  getCountryISO(value: string): void {
    this.currentCountryISO.set(value);
  }

  /**
   * Resets the form group to its initial state, clearing all form controls.
   */
  resetForm(): void {
    this.formTestGroup.reset();
  }

  // Methods for refactored component
  /**
   * Sets the current phone value to the provided value for the refactored component.
   *
   * @param value - The new value for the current phone.
   */
  getValueRefactored(value: string): void {
    this.currentPhoneValueRefactored.set(value);
  }

  /**
   * Submits the refactored form data by setting the submitted phone value to the current phone value from the form group.
   */
  onSubmitRefactored(): void {
    console.log('Form submitted!', this.formTestGroupRefactored.value);
    console.log(
      'Phone control value:',
      this.formTestGroupRefactored.get('phoneRefactored')?.value
    );
    console.log(
      'Current phone value from signal:',
      this.currentPhoneValueRefactored()
    );

    const phoneValue =
      this.formTestGroupRefactored.value['phoneRefactored'] ||
      this.currentPhoneValueRefactored();
    this.submittedPhoneValueRefactored.set(phoneValue);
  }

  /**
   * Sets the refactored phone control value to the value entered in the 'setPhoneTextboxRefactored' control.
   */
  setPhoneRefactored(): void {
    this.formTestGroupRefactored.controls['phoneRefactored'].setValue(
      this.formTestGroupRefactored.value['setPhoneTextboxRefactored']
    );
  }

  /**
   * Toggles the visibility of the set phone input field for the refactored component.
   */
  toggleShowSetPhoneInputRefactored(): void {
    this.showSetPhoneInputRefactored.set(!this.showSetPhoneInputRefactored());
  }

  /**
   * Sets the current country code to the provided value for the refactored component.
   *
   * @param value - The new country code to set.
   */
  getCountryCodeRefactored(value: string): void {
    this.currentCountryCodeRefactored.set(value);
  }

  /**
   * Sets the current country ISO code to the provided value for the refactored component.
   *
   * @param value - The new ISO code to set.
   */
  getCountryISORefactored(value: string): void {
    this.currentCountryISORefactored.set(value);
  }

  /**
   * Resets the refactored form group to its initial state, clearing all form controls.
   */
  resetFormRefactored(): void {
    this.formTestGroupRefactored.reset();
  }
}
