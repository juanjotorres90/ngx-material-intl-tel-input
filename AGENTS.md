<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix Nx commands with `npx` (for example, `npx nx build`) to avoid using a globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

# Repository agent guide

This is the canonical instruction file for AI coding agents in this
repository. Vendor-specific files should stay short and defer to this file
for engineering rules and project facts.

## Communication

- Lead every reply with the active model name.
- Give the outcome first. Keep explanations concrete, terse, and technical.
- Treat claims as hypotheses until source, configuration, or test output
  supports them.
- Never say "You're absolutely right!" or expose hidden chain-of-thought.
- State assumptions, risks, and unverified behavior explicitly.
- Do not rewrite unrelated user changes in a dirty worktree.

## Source-of-truth order

Use this order when documentation and implementation disagree:

1. Current source and tests.
2. `package.json`, `nx.json`, project configuration, and CI.
3. Root `README.md` for the supported public API.
4. This file and vendor-specific AI instruction files.
5. Historical documentation and changelog entries.

Use CodeGraph first for symbols, call paths, and change impact. Use `rg` for
literal text and documentation searches. Do not infer behavior from a method
name alone.

## Workspace map

- `libs/ngx-material-intl-tel-input-lib`: publishable package
  `ngx-material-intl-tel-input`.
- `apps/ngx-material-intl-tel-input`: demo and integration app.
- `libs/.../src/index.ts`: package public exports.
- `README.md`: public usage plus contributor workflow.
- `libs/.../README.md`: npm package README; keep its public API sections in
  sync with the root README.
- `JEST_TO_VITEST_MIGRATION_GUIDE.md`: migration record and reusable playbook.

Current stack: Angular 22, Angular Material 22, Nx 23, TypeScript 6, RxJS 7,
and Vitest 4 through Angular's `@angular/build:unit-test` builder.

## Critical component invariants

- `NgxMaterialIntlTelInputComponent` is standalone and uses OnPush change
  detection.
- It is **not** a `ControlValueAccessor` and does not provide
  `NG_VALUE_ACCESSOR`.
- Reactive Forms integration is explicit:
  - use `fieldControlName="phone"` inside a parent `[formGroup]`; or
  - pass an existing control with `[fieldControl]="phoneControl"`.
- Do not put `formControlName` or `[formControl]` on the component unless the
  implementation is intentionally changed to a real value accessor.
- The component mutates the supplied control's value, validators, dirty state,
  and disabled state. Preserve those semantics when refactoring.
- `currentValue`, `currentCountryCode`, and `currentCountryISO` are
  notifications, not the primary form-state API.
- Country localization is opt-in through `localizeCountryNames`; it uses
  `LOCALE_ID`, `Intl.DisplayNames`, and optional `COUNTRY_NAME_OVERRIDES`.

## Commands

Prefer project scripts for whole-workspace checks and Nx for focused work:

```bash
npm run lint:all
npm run unit-tests:all
npm run build:all

npx nx lint ngx-material-intl-tel-input-lib
npx nx test ngx-material-intl-tel-input-lib
npx nx test ngx-material-intl-tel-input-lib --include='**/file.spec.ts'
npx nx test ngx-material-intl-tel-input-lib --coverage
npx nx build ngx-material-intl-tel-input-lib
npx nx affected -t lint test build
```

Run the smallest relevant target while iterating. Before handoff, run checks
proportional to the change and report exactly what ran.

## Angular and TypeScript rules

- Keep strict typing. Prefer inference; use `unknown` instead of `any`.
- Use standalone declarations; Angular 22 implies `standalone: true`.
- Use `input()`, `model()`, and `output()` instead of decorators.
- Use signals for local state and `computed()` for derived state. Use
  `set()`/`update()`, never signal `mutate()`.
- Use `inject()` for dependency injection.
- Set `ChangeDetectionStrategy.OnPush` on components.
- Put host bindings and listeners in decorator `host`, not
  `@HostBinding`/`@HostListener`.
- Prefer native template control flow (`@if`, `@for`, `@switch`).
- Prefer native `class` and `style` bindings over `NgClass` and `NgStyle`.
- Keep templates simple and accessible. Preserve keyboard behavior, labels,
  focus handling, errors, and disabled states.
- Follow the repository ESLint, Prettier, and EditorConfig files. Avoid broad
  formatting churn.
- Fix root causes. Keep existing JSDoc when refactoring.

## Vitest rules

- Tests run through `@angular/build:unit-test`; globals are supplied by
  `vitest/globals`.
- Do not import runtime `describe`, `it`, `expect`, or `vi` from `vitest`.
  Type-only imports such as `MockInstance` are allowed.
- The Angular builder rejects `vi.mock()` for relative imports. Prefer:
  1. Angular TestBed provider replacements.
  2. `vi.spyOn()` on injected services or class prototypes.
  3. An exported object-call seam for free functions that esbuild inlines.
- Restore spies and real timers in cleanup. Destroy fixtures/components when
  lifecycle work, subscriptions, or timers may outlive a test.
- Test observable behavior and DOM output rather than private implementation
  details. Cover valid, invalid, empty, disabled, and lifecycle paths where
  relevant.
- Treat unhandled async errors as product defects, not runner noise.
- Keep new tests focused and consistent with neighboring specs.

## Documentation rules

- Public examples must compile conceptually and reflect the exported API.
- Always call out that the component is not a `ControlValueAccessor`.
- Keep option names, types, defaults, output formats, commands, framework
  versions, and package names synchronized with source/configuration.
- Do not rewrite historical changelog entries to match current behavior.
- Update both READMEs when public package usage changes.
- Keep `AGENTS.md`, `CLAUDE.md`, and Copilot instructions aligned, but avoid
  duplicating long generic prompting advice.

## Completion checklist

- Inspect impact before editing.
- Add or update tests for behavior changes.
- Run focused validation, then broader checks when risk warrants it.
- Run `git diff --check`.
- Review the final diff for stale names, accidental generated files, and
  unrelated changes.
- Summarize changed behavior, validation, and any remaining risk.
