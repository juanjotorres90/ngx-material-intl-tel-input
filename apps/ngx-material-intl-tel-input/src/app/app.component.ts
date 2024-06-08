import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';
import { NgxMaterialIntlTelInputComponent } from 'ngx-material-intl-tel-input';

@Component({
  standalone: true,
  imports: [
    NgxMaterialIntlTelInputComponent,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatChipsModule
  ],
  selector: 'ngx-material-intl-tel-input-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = 'ngx-material-intl-tel-input';
  currentPhoneValue = signal<string>('');
  submittedPhoneValue = signal<string>('');
  formTestGroup: FormGroup;

  constructor(private fb: FormBuilder) {
    this.formTestGroup = this.fb.group({
      phone: ['', [Validators.required]]
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
}
