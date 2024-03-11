# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

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
