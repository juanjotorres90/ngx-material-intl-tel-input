[![All Contributors](https://img.shields.io/badge/all_contributors-5-orange.svg?style=flat-square)](#contributors)

[![npm version](https://img.shields.io/npm/v/ngx-material-intl-tel-input.svg?style=flat-square)](https://www.npmjs.com/package/ngx-material-intl-tel-input)
[![npm downloads total](https://img.shields.io/npm/dt/ngx-material-intl-tel-input.svg?style=flat-square)](https://www.npmjs.com/package/ngx-material-intl-tel-input)
[![npm downloads monthly](https://img.shields.io/npm/dm/ngx-material-intl-tel-input.svg?style=flat-square)](https://www.npmjs.com/package/ngx-material-intl-tel-input)

# NgxMaterialIntlTelInput

[https://github.com/juanjotorres90/ngx-material-intl-tel-input](https://github.com/juanjotorres90/ngx-material-intl-tel-input)

Introducing an Angular library designed to streamline the input and validation of international telephone numbers. Integrates a searchable material select component for convenient country code selection. Moreover, it automatically detects the user's country, dynamically presenting a relevant placeholder for enhanced user experience. With built-in formatting and validation functionalities, this library ensures accuracy and consistency in handling telephone numbers across diverse global contexts.

Check out the [Demo](https://ngx-material-intl-tel-input.vercel.app/)

<img width="490" alt="preview" src="https://github.com/juanjotorres90/ngx-material-intl-tel-input/assets/49198908/d0714418-c1bf-45af-a98c-8c54f3eb9144">

**Compatibility:**

Validation with [google-libphonenumber](https://github.com/google/libphonenumber)

| ngx-material-intl-tel-input | Angular |
| --------------------------- | ------- |
| 20.0.0 - 20.1.2             | 20      |
| 19.0.0 - 19.2.1             | 19      |
| 18.0.0 - 18.2.1             | 18      |
| 0.0.1 - 17.3.0              | 17      |

> **Note:** This package is completely different from `ngx-intl-tel-input`, `ngx-mat-input-tel` or `intl-tel-input`. It was built from scratch specifically for Angular Material and has no relation to those packages.

## Installation

`$ npm install ngx-material-intl-tel-input --save`

Ensure to include `provideAnimations()` and `provideHttpClient()` in the providers array of your main.ts file to initialize your application with animations and auto getting country code capabilities. Refer to the Angular Docs [provideAnimations](https://angular.dev/api/platform-browser/animations/provideAnimations#) and [provideHttpClient](https://angular.dev/api/common/http/provideHttpClient#) for detailed instructions.

Additionally, it's essential to incorporate an Angular Material theme by importing the necessary CSS for styling. Please consult the [Angular Material Theming guide](https://material.angular.io/guide/theming) for instructions on how to set up the theme.

## Usage

### Import

Include the NgxMaterialIntlTelInputComponent in the imports array of the standalone component where you intend to utilize it.

```typescript
imports: [NgxMaterialIntlTelInputComponent];
```

## Example

```html
<form [formGroup]="formGroup">
  <ngx-material-intl-tel-input [fieldControl]="control" [required]="true" [autoIpLookup]="false"> </ngx-material-intl-tel-input>
</form>
```

## Options

| Options                  | Type                       | Default                                                                                                                                                                                                                                                                                                      | Description                                                                    |
| ------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| fieldControl             | `FormControl`              | `FormControl('')`                                                                                                                                                                                                                                                                                            | Form control required to retrieve the value.                                   |
| fieldControlName         | `string`                   | `''`                                                                                                                                                                                                                                                                                                         | Form control name to assign the control from a FormGroup.                      |
| required                 | `boolean`                  | `false`                                                                                                                                                                                                                                                                                                      | Telephone field input required.                                                |
| disabled                 | `boolean`                  | `false`                                                                                                                                                                                                                                                                                                      | Telephone field input disabled.                                                |
| appearance               | `'fill' \| 'outline'`      | `fill`                                                                                                                                                                                                                                                                                                       | Material form field appearance.                                                |
| autoIpLookup             | `boolean`                  | `true`                                                                                                                                                                                                                                                                                                       | Sets initial country code based on user's ip.                                  |
| autoSelectCountry        | `boolean`                  | `true`                                                                                                                                                                                                                                                                                                       | Enables or disables auto selecting a country on initialization.                |
| autoSelectedCountry      | `CountryISO \| string`     | `''`                                                                                                                                                                                                                                                                                                         | Sets the country to be auto selected.                                          |
| numberValidation         | `boolean`                  | `true`                                                                                                                                                                                                                                                                                                       | Enables or disables phone number validation.                                   |
| enableSearch             | `boolean`                  | `true`                                                                                                                                                                                                                                                                                                       | Enables or disables country search.                                            |
| includeDialCode          | `boolean`                  | `false`                                                                                                                                                                                                                                                                                                      | Includes the dial code in the phone number input.                              |
| emojiFlags               | `boolean`                  | `false`                                                                                                                                                                                                                                                                                                      | Use standard emoji icons for the country flags.                                |
| hidePhoneIcon            | `boolean`                  | `false`                                                                                                                                                                                                                                                                                                      | Hides phone icon.                                                              |
| preferredCountries       | `(CountryISO \| string)[]` | `[]`                                                                                                                                                                                                                                                                                                         | Shows the specified countries on top of the list.                              |
| visibleCountries         | `(CountryISO \| string)[]` | `[]`                                                                                                                                                                                                                                                                                                         | Shows only the specified countries.                                            |
| excludedCountries        | `(CountryISO \| string)[]` | `[]`                                                                                                                                                                                                                                                                                                         | Exclude the specified countries from the list.                                 |
| enablePlaceholder        | `boolean`                  | `true`                                                                                                                                                                                                                                                                                                       | Input placeholder text for every country national number.                      |
| iconMakeCall             | `boolean`                  | `true`                                                                                                                                                                                                                                                                                                       | Click on phone icon to trigger call action.                                    |
| initialValue             | `string`                   | `''`                                                                                                                                                                                                                                                                                                         | Sets initial telephone number value                                            |
| useMask                  | `boolean`                  | `false`                                                                                                                                                                                                                                                                                                      | Use mask for phone number input.                                               |
| forceSelectedCountryCode | `boolean`                  | `false`                                                                                                                                                                                                                                                                                                      | If useMask is active it forces the selected country code to be displayed       |
| showMaskPlaceholder      | `boolean`                  | `false`                                                                                                                                                                                                                                                                                                      | If useMask is active it shows the placeholder for the mask                     |
| outputNumberFormat       | `PhoneNumberFormat`        | `PhoneNumberFormat.INTERNATIONAL`                                                                                                                                                                                                                                                                            | Sets the output number format to INTERNATIONAL, E164, or RFC3966 format        |
| enableInputMaxLength     | `boolean`                  | `true`                                                                                                                                                                                                                                                                                                       | Enables or disables the input max length.                                      |
| localizeCountryNames     | `boolean`                  | `false`                                                                                                                                                                                                                                                                                                      | Opt-in to locale-aware country names.                                          |
| textLabels               | `TextLabels`               | {mainLabel: 'Phone number', codePlaceholder: 'Code', searchPlaceholderLabel: 'Search', noEntriesFoundLabel: 'No countries found', nationalNumberLabel: 'Number', hintLabel: 'Select country and type your phone number', invalidNumberError: 'Number is not valid', requiredError: 'This field is required'} | Overrides all component text labels                                            |
| mainLabel                | `string`                   | `''`                                                                                                                                                                                                                                                                                                         | Sets the main label of the input field. It overrides the textLabels.mainLabel. |

## Events

| Event              | Type     | Default | Description                                                          |
| ------------------ | -------- | ------- | -------------------------------------------------------------------- |
| currentValue       | `string` | `''`    | Full phone number value emitted when the value of the input changes. |
| currentCountryCode | `string` | `''`    | Country code value emitted when the value of the input changes.      |
| currentCountryISO  | `string` | `''`    | Country ISO value emitted when the value of the input changes.       |

# CSS Custom Properties Reference

## 🎨 Component Styling Variables

### Container Styles

- `--mat-filled-tel-form-outline-width`: Outline width (`default: 1px`)
- `--mat-filled-tel-form-outline-color`: Border color (`default: #d8d8d8`)
- `--mat-filled-tel-form-background`: Background color (`default: #fbfbfb`)
- `--mat-filled-tel-form-container-shape`: Border radius (`default: 8px`)

### Focus States

- `--mat-filled-tel-form-focus-outline-color`: Focus border color (`default: rgb(32, 159, 252)`)
- `--mat-filled-tel-form-focus-background`: Focus background (`default: #fff`)

### Hover States

- `--mat-filled-tel-form-hover-background`: Hover background (`default: #f5f5f5`)
- `--mat-outline-tel-form-hover-background`: Outline variant hover background (`default: #f5f5f5`)

## 📱 Input Field Customization

### Appearance

- `--mat-outline-tel-form-background`: Outline variant background (`default: #fbfbfb`)
- `--mat-tel-form-placeholder-color`: Input placeholder color (`default: #ccc`)
- `--mat-tel-form-icon-color`: Action icon color (`default: #909090`)

### Shape Customization

- `--mat-outlined-tel-form-container-shape`: Outline field border radius (`default: Material system variable`)
- `--mat-outlined-text-field-container-shape`: Text field border radius (`default: Material system variable`)

## 🔍 Validation & Feedback

- `--mat-tel-form-hint-color`: Hint text color (`default: #b2b2b2`)
- `--mat-tel-form-error-color`: Error message color (`default: Material system error`)
- `--mat-sys-error`: Material system error fallback (`default: #f44336`)

## 🖌️ Theme Integration

- `--mat-theme-primary`: Primary theme color (`default: rgb(32, 159, 252)`)
- `--mat-theme-error`: Error state color (`default: #f44336`)
- `--mat-sys-corner-extra-small`: Material system small corner radius

## Example Configuration

```css
:root {
  /* Container Customization */
  --mat-filled-tel-form-background: #f8f9fa;
  --mat-filled-tel-form-container-shape: 6px;

  /* Theme Colors */
  --mat-theme-primary: #2a7de1;
  --mat-tel-form-error-color: #dc3545;

  /* Input Styling */
  --mat-tel-form-placeholder-color: #a0aec0;
}
```

## Localization

The country selector now supports locale-aware display names and accent-insensitive search. Enable localization per instance with `[localizeCountryNames]="true"`. When disabled (default) the component keeps the original English dataset.

If the browser exposes [`Intl.DisplayNames`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DisplayNames), the component will resolve translated labels for the active `LOCALE_ID`. You can override specific entries through the `COUNTRY_NAME_OVERRIDES` token:

```ts
import { COUNTRY_NAME_OVERRIDES, CountryNameOverrides } from 'ngx-material-intl-tel-input';

const spanishCountryOverrides: CountryNameOverrides = {
  US: 'Estados Unidos de América',
  MX: 'Estados Unidos Mexicanos'
};

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    { provide: LOCALE_ID, useValue: 'es-ES' },
    {
      provide: COUNTRY_NAME_OVERRIDES,
      useValue: spanishCountryOverrides
    }
  ]
});
```

## Contributors

Thanks goes to these wonderful people:

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/juanjotorres90"><img src="https://avatars3.githubusercontent.com/u/49198908?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Juanjo Torres</b></sub></a><br /><a href="#design-juanjotorres90" title="Design">🎨</a> <a href="https://github.com/juanjotorres90/ngx-material-intl-tel-input/commits?author=juanjotorres90" title="Code">💻</a> <a href="https://github.com/juanjotorres90/ngx-material-intl-tel-input/commits?author=juanjotorres90" title="Documentation">📖</a> <a href="#ideas-juanjotorres90" title="Ideas, Planning, & Feedback">🤔</a> <a href="#question-juanjotorres90" title="Answering Questions">💬</a> <a href="#infra-juanjotorres90" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#example-juanjotorres90" title="Examples">💡</a> <a href="#maintenance-juanjotorres90" title="Maintenance">🚧</a> <a href="https://github.com/juanjotorres90/ngx-material-intl-tel-input/pulls?q=is%3Apr+reviewed-by%3Ajuanjotorres90" title="Reviewed Pull Requests">👀</a> <a href="https://github.com/juanjotorres90/ngx-material-intl-tel-input/commits?author=juanjotorres90" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/whegar"><img src="https://avatars3.githubusercontent.com/u/5524772?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Rafa Hernández</b></sub></a><br /> <a href="https://github.com/juanjotorres90/ngx-material-intl-tel-input/commits?author=whegar" title="Code">💻</a> <a href="#ideas-whegar" title="Ideas, Planning, & Feedback">🤔</a> <a href="#question-whegar" title="Answering Questions">💬</a> <a href="#infra-whegar" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-whegar" title="Maintenance">🚧</a> <a href="https://github.com/juanjotorres90/ngx-material-intl-tel-input/pulls?q=is%3Apr+reviewed-by%whegar" title="Reviewed Pull Requests">👀</a></td>
    <td align="center"><a href="https://github.com/ghollingworthh"><img src="https://avatars.githubusercontent.com/u/26550815?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Glen Hollingworth</b></sub></a><br /> <a href="https://github.com/juanjotorres90/ngx-material-intl-tel-input/commits?author=ghollingworthh" title="Code">💻</a> <a href="#ideas-ghollingworthh" title="Ideas, Planning, & Feedback">🤔</a> <a href="#question-ghollingworthh" title="Answering Questions">💬</a> <a href="#example-ghollingworthh" title="Examples">💡</a> <a href="#maintenance-ghollingworthh" title="Maintenance">🚧</a> <a href="https://github.com/juanjotorres90/ngx-material-intl-tel-input/pulls?q=is%3Apr+reviewed-by%ghollingworthh" title="Reviewed Pull Requests">👀</a></td>
    <td align="center"><a href="https://github.com/EphraimHaber"><img src="https://avatars.githubusercontent.com/u/61934858?v=4?s=100" width="100px;" alt=""/><br /><sub><b>EphraimHaber</b></sub></a><br /> <a href="https://github.com/juanjotorres90/ngx-material-intl-tel-input/commits?author=EphraimHaber" title="Code">💻</a> <a href="#ideas-EphraimHaber" title="Ideas, Planning, & Feedback">🤔</a> <a href="#question-EphraimHaber" title="Answering Questions">💬</a> <a href="#example-EphraimHaber" title="Examples">💡</a> <a href="#maintenance-EphraimHaber" title="Maintenance">🚧</a> <a href="https://github.com/juanjotorres90/ngx-material-intl-tel-input/pulls?q=is%3Apr+reviewed-by%EphraimHaber" title="Reviewed Pull Requests">👀</a></td>
    <td align="center"><a href="https://github.com/Kamma31"><img src="https://avatars.githubusercontent.com/u/50776388?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Rant</b></sub></a><br /> <a href="https://github.com/juanjotorres90/ngx-material-intl-tel-input/commits?author=Kamma31" title="Code">💻</a> <a href="#ideas-Kamma31" title="Ideas, Planning, & Feedback">🤔</a> <a href="#question-Kamma31" title="Answering Questions">💬</a> <a href="#example-Kamma31" title="Examples">💡</a> <a href="#maintenance-Kamma31" title="Maintenance">🚧</a> <a href="https://github.com/juanjotorres90/ngx-material-intl-tel-input/pulls?q=is%3Apr+reviewed-by%Kamma31" title="Reviewed Pull Requests">👀</a></td>
    <td align="center"><a href="https://github.com/jeanfwl"><img src="https://avatars.githubusercontent.com/u/67374151?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jean Talar</b></sub></a><br /> <a href="https://github.com/juanjotorres90/ngx-material-intl-tel-input/commits?author=jeanfwl" title="Code">💻</a> <a href="#ideas-jeanfwl" title="Ideas, Planning, & Feedback">🤔</a> <a href="#question-jeanfwl" title="Answering Questions">💬</a> <a href="#example-jeanfwl" title="Examples">💡</a> <a href="#maintenance-jeanfwl" title="Maintenance">🚧</a> <a href="https://github.com/juanjotorres90/ngx-material-intl-tel-input/pulls?q=is%3Apr+reviewed-by%jeanfwl" title="Reviewed Pull Requests">👀</a></td>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind are welcome!

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/juanjotorres)
