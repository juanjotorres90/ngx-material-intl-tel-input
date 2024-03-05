import { AsyncPipe, NgClass } from '@angular/common';
import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_SELECT_CONFIG,
  MatSelect,
  MatSelectModule,
} from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ReplaySubject, Subject, take, takeUntil } from 'rxjs';
import { CountryCode } from '../data/country-code';
import { Country } from '../types/country.model';
import {
  PhoneNumberFormat,
  PhoneNumberType,
  PhoneNumberUtil,
} from 'google-libphonenumber';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import TelValidators from '../validators/tel.validators';
import { GeoIpService } from '../services/geo-ip/geo-ip.service';
import { HttpClientModule } from '@angular/common/http';
import { GeoData } from '../types/geo.type';

@Component({
  selector: 'ngx-material-intl-tel-input',
  standalone: true,
  imports: [
    AsyncPipe,
    MatSelectModule,
    NgxMatSelectSearchModule,
    ReactiveFormsModule,
    NgClass,
    MatFormFieldModule,
    MatInputModule,
    HttpClientModule,
  ],
  providers: [
    CountryCode,
    {
      provide: MAT_SELECT_CONFIG,
      useValue: { overlayPanelClass: 'tel-mat-select-pane' },
    },
    GeoIpService,
  ],
  templateUrl: './ngx-material-intl-tel-input-lib.component.html',
  styleUrl: './ngx-material-intl-tel-input-lib.component.scss',
})
export class NgxMaterialIntlTelInputComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  /** control for the selected country prefix */
  public prefixCtrl: FormControl<any> = new FormControl<any>(null);

  /** control for the MatSelect filter keyword */
  public prefixFilterCtrl: FormControl<string> = new FormControl<any>('');

  /** list of countries filtered by search keyword */
  public filteredCountries: ReplaySubject<Country[]> = new ReplaySubject<
    Country[]
  >(1);

  @ViewChild('singleSelect', { static: true }) singleSelect!: MatSelect;

  /** Subject that emits when the component has been destroyed. */
  protected _onDestroy = new Subject<void>();

  allCountries: Country[] = [];
  phoneNumberUtil = PhoneNumberUtil.getInstance();

  telForm = new FormGroup({
    prefixCtrl: this.prefixCtrl,
    numberControl: new FormControl(''),
  });

  @Input() formControl = new FormControl('');
  @Input() required = true;
  @Input() disabled = false;
  @Input() enablePlaceholder = true;
  @Input() autoIpLookup = true;
  @Input() initialValue = '';

  isFocused = false;

  constructor(
    private countryCodeData: CountryCode,
    private geoIpService: GeoIpService
  ) {}

  ngOnInit() {
    this.fetchCountryData();
    if (this.required) {
      this.formControl.addValidators(Validators.required);
    }
    if (this.disabled) {
      this.telForm.disable();
      this.formControl.disable();
    }
    this.formControl.addValidators(TelValidators.isValidNumber(this.telForm));

    // load the initial countries list
    this.filteredCountries.next(this.allCountries.slice());
    // listen for search field value changes
    this.prefixFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterCountries();
      });
    this.startTelFormValueChangesListener();
    this.setInitialTelValue();
  }

  protected fetchCountryData(): void {
    this.allCountries = [];

    //TODO Add to service
    this.countryCodeData.allCountries.forEach((c) => {
      const country: Country = {
        name: c[0].toString(),
        iso2: c[1].toString(),
        dialCode: c[2].toString(),
        priority: +c[3] || 0,
        areaCodes: (c[4] as string[]) || undefined,
        htmlId: `iti-0__item-${c[1].toString()}`,
        flagClass: `iti__${c[1].toString().toLocaleLowerCase()}`,
        placeHolder: '',
      };

      if (this.enablePlaceholder) {
        country.placeHolder = this.getPhoneNumberPlaceHolder(
          country.iso2.toUpperCase()
        );
      }

      this.allCountries.push(country);
    });
  }

  protected getPhoneNumberPlaceHolder(countryCode: string): string {
    try {
      return this.phoneNumberUtil.format(
        this.phoneNumberUtil.getExampleNumberForType(
          countryCode,
          PhoneNumberType.MOBILE
        ),
        PhoneNumberFormat.NATIONAL
      );
    } catch (e) {
      return '';
    }
  }

  ngAfterViewInit(): void {
    this.setInitialPrefixValue();
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  geoIpLookup(): void {
    this.geoIpService.geoIpLookup().subscribe({
      next: (data: GeoData) => {
        const country = this.allCountries?.find(
          (c) => c.iso2 === data.country_code?.toLowerCase()
        );
        this.prefixCtrl.setValue(country);
      },
      error: () => {
        this.prefixCtrl.setValue(this.allCountries[202]);
      },
    });
  }

  /**
   * Sets the initial value after the filteredCountries are loaded initially
   */
  protected setInitialPrefixValue() {
    this.filteredCountries
      .pipe(take(1), takeUntil(this._onDestroy))
      .subscribe(() => {
        // setting the compareWith property to a comparison function
        // triggers initializing the selection according to the initial value of
        // the form control (i.e. _initializeSelection())
        // this needs to be done after the filteredCountries are loaded initially
        // and after the mat-option elements are available
        this.singleSelect.compareWith = (a: Country, b: Country) =>
          a && b && a.iso2 === b.iso2;
      });
  }

  protected filterCountries() {
    if (!this.allCountries) {
      return;
    }
    // get the search keyword
    let search = this.prefixFilterCtrl.value;
    if (!search) {
      this.filteredCountries.next(this.allCountries.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the countries
    this.filteredCountries.next(
      this.allCountries.filter(
        (country) => country?.name?.toLowerCase()?.indexOf(search) > -1
      )
    );
  }

  onInputFocus(): void {
    this.isFocused = true;
  }

  onInputBlur(): void {
    this.isFocused = false;
  }

  startTelFormValueChangesListener(): void {
    this.telForm.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe((data) => {
        if (data?.prefixCtrl?.dialCode && data?.numberControl) {
          const value = '+' + data?.prefixCtrl?.dialCode + data?.numberControl;
          try {
            const parsed = this.phoneNumberUtil.parse(
              value,
              data?.prefixCtrl?.iso2
            );
            const formatted = this.phoneNumberUtil.format(
              parsed,
              PhoneNumberFormat.INTERNATIONAL
            );
            this.formControl.setValue(formatted);
          } catch (error) {
            this.formControl.setValue(value);
          }
        } else {
          this.formControl.setValue('');
        }
      });
  }

  setInitialTelValue(): void {
    if (!this.initialValue) {
      // set initial selection
      if (this.autoIpLookup) {
        this.geoIpLookup();
      } else {
        this.prefixCtrl.setValue(this.allCountries[202]);
      }
    } else {
      try {
        const parsedNumber = this.phoneNumberUtil.parse(this.initialValue);
        const countryCode = parsedNumber.getCountryCode();
        const country = this.allCountries?.find(
          (c) => c.dialCode === `${countryCode}`
        );
        if (country) {
          this.prefixCtrl.setValue(country);
        }
        const nationalNumber =
          parsedNumber?.getNationalNumber()?.toString() || '';
        if (nationalNumber) {
          this.telForm.get('numberControl')?.setValue(nationalNumber);
        }
      } catch {
        this.telForm.get('numberControl')?.setValue(this.initialValue);
        this.formControl.setValue(this.initialValue);
      }
    }
  }
}
