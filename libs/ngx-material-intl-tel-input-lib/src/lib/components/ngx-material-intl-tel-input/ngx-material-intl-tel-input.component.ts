import {
  Component,
  input,
  output,
  model,
  inject,
  OnInit,
  OnDestroy,
  effect,
  ChangeDetectionStrategy
} from '@angular/core';
import { FormControl, AbstractControl, ControlContainer } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PhoneNumberFormat } from 'google-libphonenumber';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgClass } from '@angular/common';
import { NgTemplateOutlet } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { IMaskModule } from 'angular-imask';

import {
  PhoneInputFacadeService,
  PhoneInputConfig
} from '../../services/phone-input-facade/phone-input-facade.service';
import { CountryDataService } from '../../services/country-data/country-data.service';
import { GeoIpService } from '../../services/geo-ip/geo-ip.service';
import { CountryCode } from '../../data/country-code';
import { CountryISO } from '../../enums/country-iso.enum';
import { TextLabels } from '../../types/text-labels.type';
import { Country } from '../../types/country.model';
import { MatFormFieldAppearance } from '@angular/material/form-field';
import { MAT_SELECT_CONFIG } from '@angular/material/select';

@Component({
  selector: 'ngx-material-intl-tel-input-refactored',
  standalone: true,
  imports: [
    NgClass,
    NgTemplateOutlet,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    IMaskModule
  ],
  providers: [
    PhoneInputFacadeService,
    CountryDataService,
    GeoIpService,
    CountryCode,
    HttpClient,
    {
      provide: MAT_SELECT_CONFIG,
      useValue: { overlayPanelClass: 'tel-mat-select-pane' }
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ngx-material-intl-tel-input.component.html',
  styleUrls: ['./ngx-material-intl-tel-input.component.scss']
})
export class NgxMaterialIntlTelInputRefactoredComponent
  implements OnInit, OnDestroy
{
  protected readonly facade = inject(PhoneInputFacadeService);
  private readonly controlContainer = inject(ControlContainer, {
    optional: true
  });
  private readonly destroyed$ = new Subject<void>();

  // Configuration inputs
  fieldControl = model<
    FormControl | AbstractControl<string | null, string | null> | null
  >(new FormControl(''));
  fieldControlName = input<string>('');
  required = model<boolean>(false);
  disabled = model<boolean>(false);
  appearance = input<MatFormFieldAppearance>('fill');
  enablePlaceholder = input<boolean>(true);
  autoIpLookup = input<boolean>(true);
  autoSelectCountry = input<boolean>(true);
  autoSelectedCountry = input<CountryISO | string>('');
  numberValidation = input<boolean>(true);
  iconMakeCall = input<boolean>(true);
  initialValue = model<string>('');
  enableSearch = input<boolean>(true);
  includeDialCode = input<boolean>(false);
  emojiFlags = input<boolean>(false);
  hidePhoneIcon = input<boolean>(false);
  preferredCountries = input<(CountryISO | string)[]>([]);
  visibleCountries = input<(CountryISO | string)[]>([]);
  excludedCountries = input<(CountryISO | string)[]>([]);
  textLabels = input<TextLabels>({
    mainLabel: 'Phone number',
    codePlaceholder: 'Code',
    searchPlaceholderLabel: 'Search',
    noEntriesFoundLabel: 'No countries found',
    nationalNumberLabel: 'Number',
    hintLabel: 'Select country and type your phone number',
    invalidNumberError: 'Number is not valid',
    requiredError: 'This field is required',
    numberTooLongError: 'Phone number is too long'
  });
  useMask = input<boolean>(false);
  forceSelectedCountryCode = input<boolean>(false);
  showMaskPlaceholder = input<boolean>(false);
  outputNumberFormat = input<
    | PhoneNumberFormat.E164
    | PhoneNumberFormat.INTERNATIONAL
    | PhoneNumberFormat.RFC3966
  >(PhoneNumberFormat.INTERNATIONAL);
  enableInputMaxLength = input<boolean>(true);

  // Outputs
  currentValue = output<string>();
  currentCountryCode = output<string>();
  currentCountryISO = output<string>();

  // Internal state models
  selectedCountry = model<Country | null>(null);
  phoneNumber = model<string>('');

  constructor() {
    // React to state changes
    effect(() => {
      if (this.required()) {
        this.facade.setRequired(true);
      }
    });

    effect(() => {
      // Sync selected country changes
      const country = this.facade.selectedCountry();
      if (country && country !== this.selectedCountry()) {
        this.selectedCountry.set(country);
        this.currentCountryCode.emit(country.dialCode);
        this.currentCountryISO.emit(country.iso2);
      }
    });

    effect(() => {
      // Sync phone number changes
      const phoneNumber = this.facade.phoneNumber();
      if (phoneNumber !== this.phoneNumber()) {
        this.phoneNumber.set(phoneNumber);
        this.currentValue.emit(phoneNumber);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    // Set up field control from parent form if specified
    this.setupFieldControlFromParent();

    // Build configuration object
    const config: PhoneInputConfig = {
      enablePlaceholder: this.enablePlaceholder(),
      includeDialCode: this.includeDialCode(),
      autoIpLookup: this.autoIpLookup(),
      autoSelectCountry: this.autoSelectCountry(),
      autoSelectedCountry: this.autoSelectedCountry(),
      preferredCountries: this.preferredCountries(),
      visibleCountries: this.visibleCountries(),
      excludedCountries: this.excludedCountries(),
      useMask: this.useMask(),
      forceSelectedCountryCode: this.forceSelectedCountryCode(),
      showMaskPlaceholder: this.showMaskPlaceholder(),
      outputNumberFormat: this.outputNumberFormat(),
      numberValidation: this.numberValidation()
    };

    // Initialize the facade
    await this.facade.initialize(config);

    // Set initial value if provided
    const initialValue = this.initialValue();
    if (initialValue) {
      this.facade.setPhoneNumber(initialValue);
    }

    // Set required validator if needed
    if (this.required()) {
      this.facade.setRequired(true);
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  onCountryChanged(country: Country): void {
    this.facade.setSelectedCountry(country);
  }

  onPhoneNumberChanged(phoneNumber: string): void {
    this.facade.setPhoneNumber(phoneNumber);
  }

  onPhoneInputFocused(): void {
    this.facade.setFocusState(true);
  }

  onPhoneInputBlurred(): void {
    this.facade.setFocusState(false);
  }

  onSearchTermChanged(searchTerm: string): void {
    this.facade.filterCountries(searchTerm);
  }

  private setupFieldControlFromParent(): void {
    const fieldControlName = this.fieldControlName();

    if (fieldControlName && this.controlContainer?.control) {
      const parentControl = this.controlContainer.control.get(fieldControlName);
      if (parentControl) {
        this.fieldControl.set(parentControl as FormControl);

        // Sync facade's field control with parent control
        this.syncFieldControlWithParent(parentControl as FormControl);
      }
    }
  }

  private syncFieldControlWithParent(parentControl: FormControl): void {
    // Sync facade's field control value changes to parent control
    this.facade.fieldControl.valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe((value) => {
        if (parentControl.value !== value) {
          parentControl.setValue(value);
          parentControl.markAsTouched();
        }
      });

    // Sync facade's field control validity to parent control
    this.facade.fieldControl.statusChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        if (this.facade.fieldControl.valid !== parentControl.valid) {
          if (this.facade.fieldControl.valid) {
            parentControl.setErrors(null);
          } else {
            parentControl.setErrors(this.facade.fieldControl.errors);
          }
        }
      });

    // Sync parent control changes to facade's field control
    parentControl.valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe((value) => {
        if (this.facade.fieldControl.value !== value) {
          this.facade.fieldControl.setValue(value || '');
        }
      });
  }
}
