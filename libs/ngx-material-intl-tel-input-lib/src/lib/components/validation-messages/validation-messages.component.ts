import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TextLabels } from '../../types/text-labels.type';

@Component({
  selector: 'ngx-material-intl-tel-input-validation-messages',
  standalone: true,
  imports: [MatFormFieldModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './validation-messages.component.html',
  styleUrls: ['./validation-messages.component.scss']
})
export class ValidationMessagesComponent {
  // Inputs
  fieldControl = input<AbstractControl | null>(null);
  textLabels = input<Partial<TextLabels>>({});
  showHint = input<boolean>(true);

  /**
   * Check if required error should be shown
   */
  shouldShowRequiredError(): boolean {
    const control = this.fieldControl();
    const labels = this.textLabels();

    return !!(
      control?.hasError('required') &&
      labels?.requiredError &&
      control?.dirty
    );
  }

  /**
   * Check if invalid number error should be shown
   */
  shouldShowInvalidNumberError(): boolean {
    const control = this.fieldControl();
    const labels = this.textLabels();

    return !!(control?.hasError('invalidNumber') && labels?.invalidNumberError);
  }

  /**
   * Check if number too long error should be shown
   */
  shouldShowNumberTooLongError(): boolean {
    const control = this.fieldControl();
    const labels = this.textLabels();

    return !!(control?.hasError('numberTooLong') && labels?.numberTooLongError);
  }

  /**
   * Check if any error should be shown
   */
  hasErrors(): boolean {
    return (
      this.shouldShowRequiredError() ||
      this.shouldShowInvalidNumberError() ||
      this.shouldShowNumberTooLongError()
    );
  }

  /**
   * Get all current error messages
   */
  getErrorMessages(): string[] {
    const messages: string[] = [];
    const labels = this.textLabels();

    if (this.shouldShowRequiredError() && labels?.requiredError) {
      messages.push(labels.requiredError);
    }

    if (this.shouldShowInvalidNumberError() && labels?.invalidNumberError) {
      messages.push(labels.invalidNumberError);
    }

    if (this.shouldShowNumberTooLongError() && labels?.numberTooLongError) {
      messages.push(labels.numberTooLongError);
    }

    return messages;
  }
}
