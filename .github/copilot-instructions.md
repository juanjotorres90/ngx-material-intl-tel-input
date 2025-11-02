# Copilot Instructions for ngx-material-intl-tel-input

This is an **Angular library project** that provides a Material Design international telephone input component. The project is structured as an **Nx monorepo** with the core library and a demo application.

## 🏗️ Project Architecture

### Workspace Structure

- **Library**: `libs/ngx-material-intl-tel-input-lib/` - The publishable npm package
- **Demo App**: `apps/ngx-material-intl-tel-input/` - Development and testing application
- **Nx Monorepo**: Uses Nx 21.6.4 with Angular 20 support

### Key Dependencies

- **Core**: Angular 20, Angular Material, Angular CDK
- **Phone Validation**: `google-libphonenumber` for international phone number validation
- **UI Enhancement**: `ngx-mat-select-search` for searchable country selection
- **Input Masking**: `angular-imask` for phone number formatting

## 🚀 Development Workflows

### Essential Commands

```bash
# Development server (demo app)
nx serve ngx-material-intl-tel-input

# Build library for production
nx build ngx-material-intl-tel-input-lib

# Run all tests
npm run unit-tests:all

# Lint all projects
npm run lint:all

# Build everything
npm run build:all
```

### Testing Strategy

- **Jest** for unit testing with `jest-preset-angular`
- Coverage reports generated to `coverage/` directory
- Use `nx test <project>` for individual project testing
- All components should include `.spec.ts` files

## 📦 Library Structure & Patterns

### Component Organization

```
libs/ngx-material-intl-tel-input-lib/src/lib/
├── ngx-material-intl-tel-input-lib/     # Main component
├── components/                          # Reusable UI components
├── services/                           # Business logic & external APIs
│   ├── geo-ip/                        # IP-based country detection
│   └── country-data/                  # Country information service
├── types/                             # TypeScript interfaces
├── enums/                             # Enumerations (CountryISO)
├── data/                              # Static country codes data
├── utils/                             # Utility functions
├── validators/                        # Form validators
└── assets/                            # Static resources (flags, etc.)
```

### Key Component Patterns

#### Main Component API

The `NgxMaterialIntlTelInputComponent` follows Angular standalone component pattern:

- Uses **signals** for reactive state management
- Implements `ControlValueAccessor` for Angular Forms integration
- Supports both `fieldControl` (FormControl) and `fieldControlName` (string) patterns
- Emits events: `currentValue`, `currentCountryCode`, `currentCountryISO`

#### Form Integration Example

```typescript
// In demo app (apps/ngx-material-intl-tel-input/src/app/app.component.ts)
formTestGroup = this.fb.group({
  phone: ['', [Validators.required]]
});

// Template usage
<ngx-material-intl-tel-input
  [fieldControl]="formTestGroup.get('phone')"
  [required]="true">
</ngx-material-intl-tel-input>
```

## 🎨 Styling & Customization

### CSS Custom Properties

The library uses extensive CSS custom properties for theming:

- Material Design tokens: `--mat-*` and `--mdc-*` prefixes
- Component-specific variables for colors, borders, and spacing
- Support for both `fill` and `outline` Material form field appearances

### Key Styling Files

- Component styles use `.scss` files
- Material theme integration in demo app: `apps/ngx-material-intl-tel-input/src/m3-theme.scss`

## 🔧 Configuration & Build

### Nx Configuration

- **Plugins**: ESLint and Jest plugins auto-configured
- **Target Defaults**: Automatic caching and dependency management
- **Generator Defaults**: SCSS styling, Jest testing, ESLint linting

### Library Publishing

- **ng-packagr** builds the library to `dist/libs/ngx-material-intl-tel-input-lib/`
- Package configuration in `libs/ngx-material-intl-tel-input-lib/package.json`
- Assets (country flags) automatically copied during build via `ng-package.json`

### Dependency Management

- **Peer Dependencies**: Angular core packages (^20.0.0)
- **Direct Dependencies**: Material components, libphonenumber, utility libraries
- **Side Effects**: Marked as `false` for better tree-shaking

## 🌍 Internationalization Features

### Country Data Architecture

- Static country codes in `libs/ngx-material-intl-tel-input-lib/src/lib/data/country-code.ts`
- `CountryISO` enum for type-safe country codes
- GeoIP service for automatic country detection
- Support for emoji flags and custom flag assets

### Phone Number Validation

- Uses Google's libphonenumber for validation
- Supports multiple output formats: `INTERNATIONAL`, `E164`, `RFC3966`
- Custom Angular validators in `libs/ngx-material-intl-tel-input-lib/src/lib/validators/`

## ⚠️ Important Development Notes

### Component State Management

- Prefer **signals** over traditional properties for reactive state
- Use `effect()` for side effects and computed values
- Follow Angular's OnPush change detection strategy

### Testing Considerations

- Mock `google-libphonenumber` in tests for consistent results
- Test form integration scenarios thoroughly
- Include accessibility testing for international users

### Performance Patterns

- Country list is pre-filtered and cached
- Phone number validation is debounced to avoid excessive API calls
- Asset loading is optimized through ng-packagr configuration

When working on this library, always consider the international user experience and ensure compatibility with Angular's reactive forms and Material Design systems.
