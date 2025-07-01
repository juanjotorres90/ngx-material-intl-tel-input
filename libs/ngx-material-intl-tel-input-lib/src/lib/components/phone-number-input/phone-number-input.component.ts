import {
  Component,
  input,
  output,
  model,
  ElementRef,
  viewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  MatFormFieldModule,
  MatFormFieldAppearance
} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { NgTemplateOutlet } from '@angular/common';
import { IMaskModule } from 'angular-imask';
import { Country } from '../../types/country.model';
import { TextLabels } from '../../types/text-labels.type';

@Component({
  selector: 'ngx-material-intl-tel-input-phone-number-input',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
    NgTemplateOutlet,
    IMaskModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './phone-number-input.component.html',
  styleUrls: ['./phone-number-input.component.scss']
})
export class PhoneNumberInputComponent {
  // View children
  numberInput = viewChild<ElementRef>('numberInput');

  // Inputs
  appearance = input<MatFormFieldAppearance>('fill');
  required = input<boolean>(false);
  hidePhoneIcon = input<boolean>(false);
  iconMakeCall = input<boolean>(true);
  maxLength = input<number | null>(null);
  selectedCountry = input<Country | null>(null);
  textLabels = input<Partial<TextLabels>>({});

  // Models
  phoneNumber = model<string>('');

  // Outputs
  focused = output<void>();
  blurred = output<void>();
  valueChanged = output<string>();

  // Internal state
  numberControl = new FormControl<string>('');

  constructor() {
    // Sync model with control
    this.numberControl.valueChanges.subscribe((value) => {
      const phoneValue = value || '';
      this.phoneNumber.set(phoneValue);
      this.valueChanged.emit(phoneValue);
    });
  }

  onFocus(): void {
    this.focused.emit();
  }

  onBlur(): void {
    this.blurred.emit();
  }

  /**
   * Get the native input element
   */
  getInputElement(): HTMLInputElement | null {
    return this.numberInput()?.nativeElement || null;
  }

  /**
   * Focus the input element
   */
  focus(): void {
    const input = this.getInputElement();
    if (input) {
      input.focus();
    }
  }

  /**
   * Set cursor position in the input
   */
  setCursorPosition(position: number): void {
    const input = this.getInputElement();
    if (input) {
      input.setSelectionRange(position, position);
    }
  }

  /**
   * Get current cursor position
   */
  getCursorPosition(): number {
    const input = this.getInputElement();
    return input?.selectionStart || 0;
  }
}
