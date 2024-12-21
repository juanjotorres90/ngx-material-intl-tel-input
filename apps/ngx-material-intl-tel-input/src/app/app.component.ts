import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
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
import { RouterModule } from '@angular/router';
import { NgxMaterialIntlTelInputComponent } from 'ngx-material-intl-tel-input';

@Component({
  imports: [
    NgxMaterialIntlTelInputComponent,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule
  ],
  selector: 'ngx-material-intl-tel-input-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = 'ngx-material-intl-tel-input';
  currentPhoneValue = signal<string>('');
  currentCountryCode = signal<string>('');
  currentCountryISO = signal<string>('');
  submittedPhoneValue = signal<string>('');
  formTestGroup: FormGroup;
  showSetPhoneInput = signal<boolean>(false);

  constructor(private fb: FormBuilder) {
    this.formTestGroup = this.fb.group({
      phone: ['', [Validators.required]],
      setPhoneTextbox: ['']
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
}
