# Claude Code guidance

@AGENTS.md

`AGENTS.md` is the canonical engineering and agent guide. Read it before
changing this repository. This file adds only Claude Code-specific orientation
to avoid maintaining duplicate instructions.

## Start every task

1. Inspect the worktree and preserve unrelated uncommitted changes.
2. Use Nx workspace/project context for repository questions.
3. Use CodeGraph before reading or editing indexed TypeScript symbols.
4. Verify claims against current source and configuration, not this file.
5. Choose the smallest relevant Nx target for validation.

## Project facts

- Published package: `ngx-material-intl-tel-input`.
- Library project: `ngx-material-intl-tel-input-lib`.
- Demo project: `ngx-material-intl-tel-input`.
- Stack: Angular 22, Material 22, Nx 23, TypeScript 6, and Vitest 4.
- Main component:
  `NgxMaterialIntlTelInputComponent`.
- Public exports:
  `libs/ngx-material-intl-tel-input-lib/src/index.ts`.

## Forms contract

The component is not a `ControlValueAccessor` and does not register
`NG_VALUE_ACCESSOR`. Use one of its explicit Reactive Forms APIs:

```html
<form [formGroup]="form">
  <ngx-material-intl-tel-input fieldControlName="phone"></ngx-material-intl-tel-input>
</form>
```

or:

```html
<form [formGroup]="form">
  <ngx-material-intl-tel-input [fieldControl]="form.controls.phone"></ngx-material-intl-tel-input>
</form>
```

Do not suggest `formControlName="phone"` on the component. The
`fieldControlName` input resolves a control from the parent `ControlContainer`;
`fieldControl` accepts an existing `FormControl`/`AbstractControl`.

Signal Forms are also supported: the component implements
`FormValueControl<string>`, so bind it with `[formField]="form.phone"` and use
the exported `validPhoneNumber` schema validator.

## Validation shortcuts

```bash
npx nx test ngx-material-intl-tel-input-lib
npx nx test ngx-material-intl-tel-input-lib --include='**/file.spec.ts'
npx nx lint ngx-material-intl-tel-input-lib
npx nx build ngx-material-intl-tel-input-lib
npx nx affected -t lint test build
```

For Vitest migration-specific constraints, read
`JEST_TO_VITEST_MIGRATION_GUIDE.md`.

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
