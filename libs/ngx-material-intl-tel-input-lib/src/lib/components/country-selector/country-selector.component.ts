import {
  Component,
  input,
  output,
  OnInit,
  OnDestroy,
  viewChild,
  effect,
  ChangeDetectionStrategy
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import {
  MatFormFieldModule,
  MatFormFieldAppearance
} from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { AsyncPipe, NgClass } from '@angular/common';
import { ReplaySubject, Subject, takeUntil } from 'rxjs';
import { Country } from '../../types/country.model';
import { TextLabels } from '../../types/text-labels.type';

@Component({
  selector: 'ngx-material-intl-tel-input-country-selector',
  standalone: true,
  imports: [
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    ReactiveFormsModule,
    AsyncPipe,
    NgClass
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './country-selector.component.html',
  styleUrls: ['./country-selector.component.scss']
})
export class CountrySelectorComponent implements OnInit, OnDestroy {
  // View children
  singleSelect = viewChild<MatSelect>('singleSelect');

  // Inputs
  appearance = input<MatFormFieldAppearance>('fill');
  required = input<boolean>(false);
  isLoading = input<boolean>(false);
  enableSearch = input<boolean>(true);
  includeDialCode = input<boolean>(false);
  emojiFlags = input<boolean>(false);
  textLabels = input<Partial<TextLabels>>({});
  countries = input<Country[]>([]);

  // Models
  selectedCountry = input<Country | null>(null);

  // Outputs
  countryChanged = output<Country>();
  searchTermChanged = output<string>();

  // Internal state
  countryControl = new FormControl<Country | null>(null);
  searchControl = new FormControl<string | null>('');
  filteredCountries = new ReplaySubject<Country[]>(1);
  private destroyed$ = new Subject<void>();

  constructor() {
    // Sync country control with selected country input
    effect(() => {
      const selectedCountry = this.selectedCountry();
      if (selectedCountry && this.countryControl.value !== selectedCountry) {
        this.countryControl.setValue(selectedCountry, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    // Initialize filtered countries
    this.filteredCountries.next(this.countries());

    // Set up search functionality
    this.searchControl.valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe((searchTerm) => {
        this.filterCountries(searchTerm || '');
        this.searchTermChanged.emit(searchTerm || '');
      });

    // Sync with selected country input
    // Note: The selectedCountry is now an input, so we don't need to set it here
    // The parent component manages the selected country state

    // Watch for countries input changes
    // Note: In a real implementation, you'd use effect() for this
    this.updateFilteredCountries();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  onCountryChange(country: Country): void {
    this.countryChanged.emit(country);
  }

  private filterCountries(searchTerm: string): void {
    const countries = this.countries();
    if (!searchTerm) {
      this.filteredCountries.next(countries);
      return;
    }

    const filtered = countries.filter(
      (country) =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.iso2.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.dialCode.includes(searchTerm)
    );
    this.filteredCountries.next(filtered);
  }

  private updateFilteredCountries(): void {
    this.filteredCountries.next(this.countries());
  }
}
