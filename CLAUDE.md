# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Angular library project** that provides a Material Design international telephone input component. The project is structured as an **Nx monorepo** with the core library and a demo application.

**Main Component**: `NgxMaterialIntlTelInputComponent` - Material Design international telephone input with country selection, validation, and formatting.

**Key Features**:

- International phone number validation using Google's libphonenumber
- Country selection with searchable dropdown and flag display
- Automatic country detection via IP geolocation
- Multiple output formats (International, E164, RFC3966)
- Localization support for country names
- Extensive CSS custom properties for theming
- Angular Forms integration via ControlValueAccessor

## Architecture

### Workspace Structure

- **Library**: `libs/ngx-material-intl-tel-input-lib/` - The publishable npm package
- **Demo App**: `apps/ngx-material-intl-tel-input/` - Development and testing application
- **Nx Monorepo**: Uses Nx 22.3.1 with Angular 21 support

### Library Structure

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

## Development Commands

### Development Workflow

```bash
# Start development server (demo app)
npx nx serve ngx-material-intl-tel-input

# Build library for production
npx nx build ngx-material-intl-tel-input-lib

# Run all tests
npm run unit-tests:all

# Run tests for specific project
npx nx test ngx-material-intl-tel-input-lib
npx nx test ngx-material-intl-tel-input

# Lint all projects
npm run lint:all

# Build everything
npm run build:all
```

### Key Dependencies

- **Core**: Angular 21, Angular Material, Angular CDK
- **Phone Validation**: `google-libphonenumber` for international phone number validation
- **UI Enhancement**: `ngx-mat-select-search` for searchable country selection
- **Input Masking**: `angular-imask` for phone number formatting

## Component Patterns

### Main Component API

The `NgxMaterialIntlTelInputComponent` follows Angular standalone component pattern:

- Uses **signals** for reactive state management
- Implements `ControlValueAccessor` for Angular Forms integration
- Supports both `fieldControl` (FormControl) and `fieldControlName` (string) patterns
- Emits events: `currentValue`, `currentCountryCode`, `currentCountryISO`

### Form Integration Example

```typescript
formTestGroup = this.fb.group({
  phone: ['', [Validators.required]]
});

// Template usage
<ngx-material-intl-tel-input
  [fieldControl]="formTestGroup.get('phone')"
  [required]="true">
</ngx-material-intl-tel-input>
```

## Styling & Customization

The library uses extensive CSS custom properties for theming:

- Material Design tokens: `--mat-*` and `--mdc-*` prefixes
- Component-specific variables for colors, borders, and spacing
- Support for both `fill` and `outline` Material form field appearances

Key customization variables:

- `--mat-filled-tel-form-background`, `--mat-filled-tel-form-container-shape`
- `--mat-theme-primary`, `--mat-tel-form-error-color`
- `--mat-tel-form-placeholder-color`, `--mat-tel-form-icon-color`

## Technology Stack

- **Angular 21.0.6** with standalone components and signals
- **Angular Material 21.0.3** with CDK
- **Google libphonenumber** for validation
- **Nx 22.0.2** for monorepo management
- **Jest** for testing with `jest-preset-angular`
- **ESLint** for linting with Angular-specific rules
- **Prettier** for code formatting
- **TypeScript 5.9.3** with strict typing

## Key Development Patterns

- **Standalone Components** using Angular's new component architecture
- **Signals** for reactive state management over traditional properties
- **OnPush change detection** for performance
- **ControlValueAccessor** for form integration
- **CSS custom properties** for theming
- **Extensive use of RxJS** for async operations
- **Jest** for unit testing with mocking of external dependencies

## Important Notes

- Component uses Google's libphonenumber for phone validation - mock this in tests
- Country data is static but includes localization support via `Intl.DisplayNames`
- The library is published as `@ngx-material-intl-tel-input/source` to npm
- Uses Husky for git hooks and conventional commits
- Supports both emoji flags and custom flag assets
- Phone number validation can be disabled via `[numberValidation]="false"`

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

# CI Error Guidelines

If the user wants help with fixing an error in their CI pipeline, use the following flow:

- Retrieve the list of current CI Pipeline Executions (CIPEs) using the `nx_cloud_cipe_details` tool
- If there are any errors, use the `nx_cloud_fix_cipe_failure` tool to retrieve the logs for a specific task
- Use the task logs to see what's wrong and help the user fix their problem. Use the appropriate tools if necessary
- Make sure that the problem is fixed by running the task that you passed into the `nx_cloud_fix_cipe_failure` tool

<!-- nx configuration end-->
