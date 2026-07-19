# Copilot instructions

Follow `AGENTS.md`; it is the canonical source for engineering rules, project
facts, validation commands, and the completion checklist. If this file
conflicts with source/configuration or `AGENTS.md`, use that order of
precedence and flag the stale instruction.

## Response behavior

- Lead replies with the active model name.
- Give the direct answer first and keep prose concise.
- Verify assertions against source, configuration, or test output.
- Preserve unrelated changes in the worktree.
- Fix causes rather than masking symptoms.
- Report which checks ran and which did not.

## Repository context

- Angular 22 + Angular Material 22 standalone library in an Nx 23 workspace.
- TypeScript 6, RxJS 7, and Vitest 4.
- Publishable library:
  `libs/ngx-material-intl-tel-input-lib`.
- Demo app:
  `apps/ngx-material-intl-tel-input`.
- Public package:
  `ngx-material-intl-tel-input`.
- Public exports:
  `libs/ngx-material-intl-tel-input-lib/src/index.ts`.

## Non-negotiable forms contract

`NgxMaterialIntlTelInputComponent` is not a `ControlValueAccessor` and does
not provide `NG_VALUE_ACCESSOR`.

Use:

```html
<form [formGroup]="form">
  <ngx-material-intl-tel-input fieldControlName="phone"></ngx-material-intl-tel-input>
</form>
```

or bind an existing control through `[fieldControl]`. Never generate
`formControlName` or `[formControl]` directly on this component unless the
implementation is deliberately converted into a real value accessor.

The outputs `currentValue`, `currentCountryCode`, and `currentCountryISO` are
notifications. The supplied/resolved form control remains the form-state
source of truth.

## Implementation conventions

- Use standalone declarations, signals, `input()`/`model()`/`output()`,
  `computed()`, `inject()`, and OnPush change detection.
- Use native template control flow and native class/style bindings.
- Keep strict typing; avoid `any`, decorator inputs/outputs, `NgClass`,
  `NgStyle`, `@HostBinding`, and `@HostListener`.
- Preserve accessibility, validation, formatting, disabled-state, and
  localization behavior.
- Use CodeGraph for structural exploration and `rg` for literal searches.
- Prefer Nx targets over invoking underlying tools directly.

## Testing

Tests use Angular's `@angular/build:unit-test` builder with Vitest globals.

- Do not runtime-import `describe`, `it`, `expect`, or `vi` from `vitest`.
- Do not use `vi.mock()` for relative imports; the Angular builder rejects it.
- Prefer TestBed provider replacements, `vi.spyOn()`, or an exported object
  seam for free functions.
- Clean up spies, timers, subscriptions, fixtures, and component lifecycle
  work.
- Treat unhandled async errors as real failures.

```bash
npx nx test ngx-material-intl-tel-input-lib
npx nx test ngx-material-intl-tel-input-lib --include='**/file.spec.ts'
npx nx test ngx-material-intl-tel-input-lib --coverage
npx nx affected -t lint test build
```

Keep root/package READMEs synchronized for public API changes. Do not edit
historical changelog entries to describe current behavior.
