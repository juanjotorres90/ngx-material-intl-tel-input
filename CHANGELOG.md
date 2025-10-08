# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [20.1.2] - 2025-10-08

### Fixed

- Fix cursor position when 'numberValidation' is disabled.

## [20.1.1] - 2025-07-11

### Changed

- Remove ngTemplateOutlet usage to render the phone icon to prevent possible issues running unit tests after Angular 20.1.0 upgrade.

## [20.1.0] - 2025-07-10

### Added

- Add 'mainLabel' option to just set the main label of the input field ([#17](https://github.com/juanjotorres90/ngx-material-intl-tel-input/issues/17#issuecomment-3015066525)).

### Fixed

- Fix initial value not being set properly when the field is disabled ([#50](https://github.com/juanjotorres90/ngx-material-intl-tel-input/issues/50)).

## [20.0.0] - 2025-06-13

### Added

- Add support for Angular 20.
- Add 'enableInputMaxLength' option to enable or disable the 'maxlength' attribute on the number input field, true by default to prevent errors for long numbers ([#47](https://github.com/juanjotorres90/ngx-material-intl-tel-input/issues/47)).

### Fixed

- Fix cursor position when using 'includeDialCode' and 'outputNumberFormat' E164 or RFC3966 options ([#47](https://github.com/juanjotorres90/ngx-material-intl-tel-input/issues/47)).

## [19.2.1] - 2025-02-13

### Fixed

- Fix cursor position when using 'includeDialCode' option. ([#41](https://github.com/juanjotorres90/ngx-material-intl-tel-input/issues/41)).

## [19.2.0] - 2025-01-25

### Added

- Add 'outputNumberFormat' option to set the output number to INTERNATIONAL, E164, or RFC3966 format.
- Add css variables to customize the input field appearance ([#34](https://github.com/juanjotorres90/ngx-material-intl-tel-input/pull/34)).

### Fixed

- Clear the number input field when a form reset is triggered ([#37](https://github.com/juanjotorres90/ngx-material-intl-tel-input/issues/37)).
- Fix cursor position when editing the number from the middle or start position ([#37](https://github.com/juanjotorres90/ngx-material-intl-tel-input/issues/37)).

## [19.1.0] - 2024-12-21

### Added

- Add 'currentCountryCode' output event to retrieve the current country code number selected ([#30](https://github.com/juanjotorres90/ngx-material-intl-tel-input/issues/30)).
- Add 'currentCountryISO' output event to retrieve the current country ISO code selected ([#31](https://github.com/juanjotorres90/ngx-material-intl-tel-input/issues/31)).

## [19.0.0] - 2024-12-07

### Added

- Add support for Angular 19 ([#25](https://github.com/juanjotorres90/ngx-material-intl-tel-input/issues/25)).
- Add 'useMask' option to enable masking of the phone number input.

### Changed

- Upgrade project to nx 20.2.
- Upgrade project to use ESLint 9.

## [18.2.1] - 2024-11-22

### Added

- Add 'appearance' option to set the material form field appearance ([#22](https://github.com/juanjotorres90/ngx-material-intl-tel-input/pull/22)).

## [18.2.0] - 2024-08-15

### Added

- Add country's name tooltip when hovering over country selection element.

### Fixed

- Fix match area codes or priority when determining country code ([#13](https://github.com/juanjotorres90/ngx-material-intl-tel-input/pull/13))

## [18.1.1] - 2024-07-27

### Added

- Add error border color when the field is invalid, dirty and not focused.

### Fixed

- Fix 'ng-invalid' class not being applied when the field is not valid ([#11](https://github.com/juanjotorres90/ngx-material-intl-tel-input/issues/11)).

## [18.1.0] - 2024-07-13

### Added

- Add 'emojiFlag' option to use standard emoji icons for the country flags.
- Add 'hidePhoneIcon' option to hide the phone icon.

## [18.0.1] - 2024-06-08

### Added

- Add 'fieldControlName' option to get the form control from the parent form group by name.
- Ability to dynamically change the form field value.
- Ability to dynamically enable or disable the form field.

### Fixed

- Fix "AbstractControl" not assignable to FieldControl.
- Fix setting the initial value and status of the phone field control when it was set in the parent form group control.

## [18.0.0] - 2024-05-26

### Added

- Add support for Angular 18.
- Add 'includeDialCode' option to include the dial code in the phone number input.
- Auto select number input after changing country code.
- Add support for Material 3 theming.
- Use of Signal Inputs to dynamically change the disabled or required state of the phone field.
- Add 'currentValue' output event to retrieve the current phone number value without using a FormControl.

### Fixed

- Fix Northern Mariana Islands number format.

### Changed

- Upgrade project to nx 19.1.
- Use of Signal Inputs for component options.
- The component is now zoneless.

## [17.3.0] - 2024-03-16

### Added

- Add 'enableSearch' option to enable or disable country search.
- Add 'excludedCountries' option to exclude countries from the list.

### Changed

- Update mat select dropdown styling.

## [17.2.2] - 2024-03-11

### Added

- Add linting and unit tests execution on pre-commit and ci.

### Fixed

- Fix flags css on library build.

## [17.2.1] - 2024-03-10

### Added

- Add 'autoSelectCountry' option to enable auto selecting a country on initialization.
- Add 'autoSelectedCountry' option to set the country to be auto selected.
- Add 'numberValidation' option to disable phone number validation.
- Add 'preferredCountries' option to show them on top of the country list.
- Add 'visibleCountries' option to only show the specified countries.
- Export "CountryISO" type.

### Changed

- Fetch country data refactor. Now a service handles all the logic.

### Removed

- Remove unused css.

## [17.2.0] - 2024-03-07

🎉🚀 First stable release 🚀🎉

### Added

- Export "TextLabels" type.

### Fixed

- Remove telephone form to avoid hydration issues.
- Rename main FormControl from "formControl" to "fieldControl" to avoid errors.
- Show field required error only when the field control is dirty.

## [0.0.3] - 2024-03-07

- Update library README image preview.

## [0.0.2] - 2024-03-06

- Add README to library build.

## [0.0.1] - 2024-03-06

- Initial version.
