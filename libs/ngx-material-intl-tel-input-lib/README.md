[![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg?style=flat-square)](#contributors)

[![npm version](https://img.shields.io/npm/v/ngx-material-intl-tel-input.svg?style=flat-square)](https://www.npmjs.com/package/ngx-material-intl-tel-input)
[![npm downloads total](https://img.shields.io/npm/dt/ngx-material-intl-tel-input.svg?style=flat-square)](https://www.npmjs.com/package/ngx-material-intl-tel-input)
[![npm downloads monthly](https://img.shields.io/npm/dm/ngx-material-intl-tel-input.svg?style=flat-square)](https://www.npmjs.com/package/ngx-material-intl-tel-input)

# NgxMaterialIntlTelInput

[https://github.com/juanjotorres90/ngx-material-intl-tel-input](https://github.com/juanjotorres90/ngx-material-intl-tel-input)

An Angular library for entering and validating international telephone numbers. It adds searchable material select to look for country codes, detects the user's country, displays a relevant placeholder and provides formatting/validation methods.

<img width="490" alt="preview" src="https://github.com/juanjotorres90/ngx-material-intl-tel-input/assets/49198908/770096e5-55f7-433f-a36d-046028196145">

**Compatibility:**

Validation with [google-libphonenumber](https://github.com/google/libphonenumber)

| ngx-material-intl-tel-input | Angular   |
| --------------------------- | --------- |
| 0.0.1 - 17.2.0              | >= 17.2.0 |

## Installation

`$ npm install ngx-material-intl-tel-input --save`

Make sure to add `provideAnimations()` in the providers array of your main.ts to bootstrap your application [Angular Docs](https://angular.io/api/platform-browser/animations/provideAnimations).

An Angular Material theme is required, the necessary css must be imported [Angular Material Theming](https://material.angular.io/guide/theming).

## Usage

### Import

Add the `NgxMaterialIntlTelInputComponent` to your imports array in the standalone component where it is going to be used.

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

| Options           | Type          | Default                                                                                                                                                                                                                                                                                                        | Description                                               |
| ----------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| fieldControl      | `FormControl` | `FormControl('')`                                                                                                                                                                                                                                                                                              | Form control required to retrieve the value.              |
| required          | `boolean`     | `false`                                                                                                                                                                                                                                                                                                        | Telephone field input required.                           |
| disabled          | `boolean`     | `false`                                                                                                                                                                                                                                                                                                        | Telephone field input disabled.                           |
| autoIpLookup      | `boolean`     | `true`                                                                                                                                                                                                                                                                                                         | Sets initial country code based on user's ip.             |
| enablePlaceholder | `boolean`     | `true`                                                                                                                                                                                                                                                                                                         | Input placeholder text for every country national number. |
| iconMakeCall      | `boolean`     | `true`                                                                                                                                                                                                                                                                                                         | Click on phone icon to trigger call action.               |
| initialValue      | `string`      | ``                                                                                                                                                                                                                                                                                                             | Sets initial telephone number value                       |
| textLabels        | `TextLabels`  | `{mainLabel: 'Phone number', codePlaceholder: 'Code', searchPlaceholderLabel: 'Search', noEntriesFoundLabel: 'No countries found', nationalNumberLabel: 'Number', hintLabel: 'Select country and type your phone number', invalidNumberError: 'Number is not valid', requiredError: 'This field is required`}` | Overrides all component text labels                       |

## Contributors

Thanks goes to these wonderful people:

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/juanjotorres90"><img src="https://avatars3.githubusercontent.com/u/49198908?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Juanjo Torres</b></sub></a><br /><a href="#design-juanjotorres90" title="Design">🎨</a> <a href="https://github.com/juanjotorres90/ngx-material-intl-tel-input/commits?author=juanjotorres90" title="Code">💻</a> <a href="https://github.com/juanjotorres90/ngx-material-intl-tel-input/commits?author=juanjotorres90" title="Documentation">📖</a> <a href="#ideas-juanjotorres90" title="Ideas, Planning, & Feedback">🤔</a> <a href="#question-juanjotorres90" title="Answering Questions">💬</a> <a href="#infra-juanjotorres90" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#example-juanjotorres90" title="Examples">💡</a> <a href="#maintenance-juanjotorres90" title="Maintenance">🚧</a> <a href="https://github.com/juanjotorres90/ngx-material-intl-tel-input/pulls?q=is%3Apr+reviewed-by%3Ajuanjotorres90" title="Reviewed Pull Requests">👀</a> <a href="https://github.com/juanjotorres90/ngx-material-intl-tel-input/commits?author=juanjotorres90" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/whegar"><img src="https://avatars3.githubusercontent.com/u/5524772?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Rafa Hernández</b></sub></a><br /> <a href="https://github.com/juanjotorres90/ngx-material-intl-tel-input/commits?author=whegar" title="Code">💻</a> <a href="#ideas-whegar" title="Ideas, Planning, & Feedback">🤔</a> <a href="#question-whegar" title="Answering Questions">💬</a> <a href="#infra-whegar" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-whegar" title="Maintenance">🚧</a> <a href="https://github.com/juanjotorres90/ngx-material-intl-tel-input/pulls?q=is%3Apr+reviewed-by%whegar" title="Reviewed Pull Requests">👀</a></td>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind are welcome!
