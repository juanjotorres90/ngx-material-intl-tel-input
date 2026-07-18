# Angular 22 Migration Guide for an Nx Monorepo

This document records the Angular 21 to Angular 22 migration performed in
`ngx-material-intl-tel-input`. It is intended as a reusable runbook for another
Nx monorepo, not as a command transcript that should be copied without review.

The important lesson from this migration is that a successful `nx migrate` run
is only the beginning. The generated compatibility changes preserved old
behavior, but several of them were intentionally temporary and needed manual
cleanup before the workspace was ready for release.

## Migration outcome

The workspace moved from this toolchain:

| Package                  | Before |
| ------------------------ | ------ |
| Angular                  | 21.1.x |
| Angular Material and CDK | 21.1.x |
| Nx                       | 22.7.3 |
| TypeScript               | 5.9.3  |
| Jest preset Angular      | 16.x   |
| `ngx-mat-select-search`  | 8.x    |
| Zone.js                  | 0.16.0 |

To this tested toolchain:

| Package                  | After                                               |
| ------------------------ | --------------------------------------------------- |
| Angular                  | 22.0.6                                              |
| Angular Material and CDK | 22.0.4                                              |
| Nx                       | 23.1.0                                              |
| TypeScript               | 6.0.3                                               |
| Jest preset Angular      | 17.0.0                                              |
| `ngx-mat-select-search`  | 9.x                                                 |
| Zone.js                  | 0.16.2, retained only for the zone-based Jest setup |

The final workspace passed:

- 273 Jest tests.
- Application and library lint targets with zero errors.
- Angular application production build.
- Angular library production build in partial compilation mode.
- A clean `npm ci` using a supported Node.js version.
- `npm pack --dry-run` for the library, including its license and declarations.

## Official compatibility requirements

Angular 22.0.x officially supports:

- Node.js `^22.22.3`, `^24.15.0`, or the compatible Node 26 range.
- TypeScript `>=6.0.0 <6.1.0`.
- RxJS `^6.5.3` or `^7.4.0`.

See the
[Angular version compatibility table](https://angular.dev/reference/versions)
before selecting exact versions. Also inspect the installed Angular CLI
package's `engines` field because it is what the local CLI enforces:

```bash
node -p "require('@angular/cli/package.json').engines"
```

This project was validated with Node.js 24.18.0. Node.js 24.14.0 was too old
for Angular CLI 22.0.6. An unsupported Node version can cause commands to exit
before the Angular or Nx task produces a useful diagnostic.

Pin a supported version in development and CI. A loose CI value such as `24`
currently resolves to a supported release, but an exact `.nvmrc`,
`.node-version`, Volta configuration, or CI version is more reproducible.

## Recommended migration strategy

Nx recommends upgrading one major version at a time. For Angular workspaces,
this is effectively required because Angular packages only retain migrations
for one major transition. See the
[Nx advanced update process](https://nx.dev/docs/guides/tips-n-tricks/advanced-update).

The source workspace was already on Angular 21 and Nx 22, so the migration
crossed one major boundary for each framework.

### 1. Establish a clean baseline

Create a dedicated branch and ensure the workspace starts clean:

```bash
git switch -c chore/angular-22
npm ci
npx nx report
npx nx run-many -t lint test
npx nx run ngx-material-intl-tel-input-lib:build:production
npx nx run ngx-material-intl-tel-input:build:production --progress=false
git status --short
```

Record:

- The current Node, npm, Angular, Nx, TypeScript, and RxJS versions.
- Existing lint warnings separately from errors.
- Test counts and coverage thresholds.
- Build artifact paths and bundle budgets.
- Existing package versions, peer ranges, and release tags.

Do not combine unrelated feature work with the framework migration.

### 2. Generate the Nx migration plan

Use `nx migrate`, not `ng update`, in an Nx workspace. Nx generates a
`migrations.json` file and allows migrations to be reviewed, reordered,
rerun, or committed in checkpoints. See
[Nx and the Angular CLI](https://nx.dev/docs/technologies/angular/guides/nx-and-angular).

A representative sequence is:

```bash
npx nx migrate 23.1.0
git diff -- package.json migrations.json
npm install
npx nx migrate --run-migrations
```

Select the exact Nx target using the Nx/Angular compatibility data for the
destination workspace. If package selection is available, start with required
updates and add optional updates deliberately in a second pass.

Commit migration checkpoints. Small commits made it possible to identify which
migration introduced each compatibility shim in this project.

### 3. Review the generated migration manifest

The relevant generated migrations in this workspace included:

- Nx 23 configuration and internal import migrations.
- ESLint flat-config conversion.
- Jest 30 and ts-jest compatibility migrations.
- TypeScript 6 compatibility migrations.
- Angular 22 template and change-detection migrations.
- Angular Material 22 and CDK 22 migrations.
- Addition of the direct `@angular/build` dependency.

Many migrations were no-ops because the workspace did not use SSR, Karma,
NgRx, Module Federation, hydration, or custom Nx plugins. Do not delete those
entries before running the migration; they may be active in another monorepo.

After every migration group, run the narrowest relevant target before moving
on. For example, run lint after ESLint conversion and library compilation after
template migrations.

## TypeScript 6 cleanup

TypeScript 6 was the most important non-Angular part of this upgrade. Read the
[TypeScript 6 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html)
before accepting generated `tsconfig` changes.

### What the Nx migration generated

The Nx migration deliberately preserved TypeScript 5 behavior by adding:

```json
{
  "strict": false,
  "noUncheckedSideEffectImports": false,
  "types": ["*"],
  "esModuleInterop": false,
  "ignoreDeprecations": "6.0"
}
```

This is a transition strategy, not a recommended final TypeScript 6
configuration. It prevents an upgrade from changing behavior immediately, but
it preserves defaults that TypeScript 6 intentionally modernized.

The migration also added `ignoreDeprecations` to child `tsconfig.json` files.
That can keep deprecated options compiling temporarily, but those options are
scheduled for removal in TypeScript 7.

### Final configuration used here

This workspace adopted modern TypeScript 6 behavior explicitly:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "target": "es2022",
    "module": "preserve",
    "lib": ["es2022", "dom"],
    "strict": true,
    "noUncheckedSideEffectImports": true,
    "types": [],
    "esModuleInterop": true
  }
}
```

It also removed:

- `moduleResolution: "node"`, which is deprecated in TypeScript 6.
- `emitDecoratorMetadata`, which Angular does not require and which generated
  ts-jest warnings with isolated compilation.
- All `ignoreDeprecations: "6.0"` entries after the deprecated settings were
  fixed.

For a bundled Angular browser application, `module: "preserve"` with
`moduleResolution: "bundler"` is the appropriate modern pairing. A Node-only
project may need `nodenext` instead. Do not force the browser configuration on
Node executors, scripts, or SSR servers without checking their runtime model.

TypeScript 6 defaults `types` to an empty list. Keep ambient types explicit in
leaf configurations:

```json
{
  "compilerOptions": {
    "types": ["jest", "node"]
  }
}
```

Application and publishable-library builds in this workspace use `types: []`.
Jest configurations use `types: ["jest", "node"]`.

### Root directory changes

TypeScript 6 changed `rootDir` inference. Nx may add explicit `rootDir` values
to project configurations to preserve TypeScript 5 emit layouts and avoid
`TS5011` or `TS6059`, especially with project references and ts-jest.

Do not remove generated `rootDir` values without comparing emitted paths and
running affected tests. This workspace already had a suitable root setting.

## Angular 22 template migrations

### Safe optional chaining

Angular 22 generated compatibility wrappers such as:

```html
[imask]="$safeNavigationMigration(control.value?.mask)"
```

`$safeNavigationMigration` is a migration shim, not application-facing API.
Its purpose is to preserve old safe-navigation behavior while Angular narrows
the result of optional chains.

This project reviewed each call site and removed the wrappers because the
consumers already accepted `undefined`:

```html
[imask]="control.value?.mask"
```

Do not remove the wrapper mechanically. For every occurrence:

1. Determine whether the old expression produced `null` where the new one can
   produce `undefined`.
2. Check the receiving input, function, pipe, validator, and test assertions.
3. Normalize explicitly if the consumer requires `null` or another sentinel.
4. Run strict template compilation and behavioral tests.

The `strict-safe-navigation-narrow` migration also added these diagnostic
suppressions to build configurations:

```json
{
  "angularCompilerOptions": {
    "extendedDiagnostics": {
      "checks": {
        "nullishCoalescingNotNullable": "suppress",
        "optionalChainNotNullable": "suppress"
      }
    }
  }
}
```

This project retained those suppressions during the Angular 22 release. In a
larger monorepo, remove them incrementally after cleaning the affected
templates so new redundant optional chains are detected.

### Change detection strategy

Angular 22 defaults components to `ChangeDetectionStrategy.OnPush`. The
`change-detection-eager` migration adds explicit
`ChangeDetectionStrategy.Eager` to components that previously relied on eager
checking, preserving their behavior.

Review every generated `Eager` entry rather than deleting it globally. Convert
a component to OnPush only after confirming that it notifies Angular through
signals, inputs, events, `AsyncPipe`, `markForCheck`, or equivalent APIs.

This library already declared OnPush explicitly, so no compatibility override
was necessary. See
[Angular component configuration](https://angular.dev/guide/components/advanced-configuration)
and the
[zoneless compatibility guide](https://angular.dev/guide/zoneless).

### Native class bindings

The migration was also used as an opportunity to remove `NgClass` imports and
replace `ngClass` with native class bindings:

```html
<div [class.is-focused]="isFocused()"></div>
<div [class]="country.flagClass"></div>
```

After changing templates, remove `NgClass` from standalone component imports.
Use `[class.name]` for individual flags and `[class]` for a string, array, or
class map.

## HTTP configuration in Angular 22

Angular provides `HttpClient` in the root by default starting in v21. The
official
[HttpClient setup guide](https://angular.dev/guide/http/setup)
states that `provideHttpClient` is only needed to configure optional features.

Examples that still require explicit configuration include:

- Functional or DI-based interceptors.
- JSONP support.
- Custom XSRF behavior.
- Requests delegated to a parent injector.
- Opting into XHR instead of the default Fetch backend.

Do not retain an empty `provideHttpClient()` merely because an application
injects `HttpClient`.

This workspace removed these unnecessary providers:

```typescript
provideHttpClient(withFetch(), withInterceptorsFromDi());
provideHttpClient(withFetch());
```

The IP lookup feature continued working with its input enabled in the demo
application.

HTTP unit tests still need the testing backend:

```typescript
providers: [GeoIpService, provideHttpClientTesting()];
```

When testing requests, subscribe first, then match and flush the request
outside the subscription callback:

```typescript
service.lookup().subscribe((data) => expect(data).toEqual(expected));

const request = httpTesting.expectOne('/api/lookup');
expect(request.request.method).toBe('GET');
request.flush(expected);
```

Placing `expectOne()` and `flush()` inside the response callback creates an
ordering error because the callback cannot run until the request is flushed.

### Side-effectful inputs should default off

The library's `autoIpLookup` input triggers an external network request. Its
default changed from `true` to `false`, and the demo opts in explicitly:

```html
<phone-input [autoIpLookup]="true" />
```

This was a project API decision, not an Angular 22 requirement. It is a useful
pattern for libraries: construction should not unexpectedly perform network,
geolocation, analytics, or storage operations.

## Animations cleanup

`@angular/animations` and `provideAnimations` are deprecated. Angular
recommends native CSS plus `animate.enter` and `animate.leave`; see the
[animations migration guide](https://angular.dev/guide/animations/migration).

This workspace did not use legacy Angular animation triggers, so it removed:

- `@angular/animations` from dependencies.
- `provideAnimations()` from application configuration and documentation.
- `BrowserAnimationsModule` from application tests.
- `NoopAnimationsModule` from library tests.

Angular TestBed disables native CSS animations by default. Only enable them in
tests that intentionally verify browser animation behavior.

Before removing the package in another monorepo, search for:

```bash
rg "@angular/animations|provideAnimations|BrowserAnimationsModule|NoopAnimationsModule|trigger\\(" apps libs
```

If legacy triggers exist, migrate those components before removing the package.

## Zoneless behavior

Zoneless change detection is the default in Angular v21 and later. Therefore,
`provideZonelessChangeDetection()` is redundant unless it is being used in a
specific child injector or test configuration. See the
[Angular zoneless guide](https://angular.dev/guide/zoneless).

This application removed the provider from its bootstrap configuration and
verified that `provideZoneChangeDetection` was not restoring zone-based
runtime behavior.

Zone.js was not removed from this workspace because both Jest environments
still use:

```typescript
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
```

For a fully zoneless monorepo, migrate tests to the preset's zoneless setup,
remove Zone.js from build and test polyfills, then remove the dependency. Treat
that as a separate migration because test scheduling and `fixture.detectChanges`
assumptions can change.

## Angular build executor cleanup

The Nx migration added `@angular/build` directly, but it did not replace every
old executor in this workspace. A manual follow-up was required.

The final application targets use:

```json
{
  "build": {
    "executor": "@angular/build:application"
  },
  "serve": {
    "executor": "@angular/build:dev-server"
  },
  "extract-i18n": {
    "executor": "@angular/build:extract-i18n"
  }
}
```

The matching Nx default must use the same executor key:

```json
{
  "targetDefaults": {
    "@angular/build:application": {
      "cache": true,
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"]
    }
  }
}
```

After replacing all old executors, remove
`@angular-devkit/build-angular`. New Angular applications use the esbuild-based
`@angular/build:application` builder; see
[Building Angular apps](https://angular.dev/tools/cli/build).

This cleanup removed the deprecated Webpack builder stack and approximately
165 installed packages from this workspace.

Also remove `@angular/platform-browser-dynamic` when the workspace uses
`bootstrapApplication` from `@angular/platform-browser` and has no dynamic
platform imports.

Verify the removals:

```bash
npm ls @angular-devkit/build-angular \
  @angular/platform-browser-dynamic --all
```

## ESLint migration

Nx 23 converted remaining compatibility-based ESLint configurations to native
flat configuration. In this workspace that meant:

- Adding the `angular-eslint` package.
- Replacing `FlatCompat` usage.
- Applying `angular.processInlineTemplates` to TypeScript files.
- Using Nx flat Angular and Angular-template presets.
- Preserving component and directive selector rules.

Review selector prefixes and any rules whose defaults changed. A migration can
produce a syntactically valid config that silently changes the effective rule
set.

Run every project lint target after conversion:

```bash
npx nx run-many -t lint
```

Record existing warnings, but require zero errors before proceeding.

## Jest and test configuration

This project retained Jest 30 with `jest-preset-angular` 17 and ts-jest 29.
Relevant checks for another monorepo include:

- `isolatedModules` settings in `tsconfig.spec.json`.
- Explicit `types: ["jest", "node"]` under TypeScript 6.
- Zone-based versus zoneless test setup.
- HTTP testing provider order.
- Removal of animation test modules when legacy animations are gone.
- Tests that depend on eager change detection.

Run tests without Nx cache at least once during the migration:

```bash
npx nx run-many -t test --skip-nx-cache
```

Cached successes are useful during normal development but are not enough for a
framework release gate.

## Publishable library metadata

An application-only monorepo can skip this section. A publishable Angular
library needs a second audit beyond compiling successfully.

### Align every version source

For this release, `22.1.0` had to match in:

- Root `package.json`.
- Root `package-lock.json`, including `packages[""]`.
- Library `package.json`.
- README compatibility table.
- Changelog.
- Git tag expected by the publish workflow.

Regenerate the lockfile after version changes:

```bash
npm install --package-lock-only --ignore-scripts
```

### Choose peer ranges intentionally

This project publishes Angular peers as `>=22.0.0`. That allows future Angular
majors and is an explicit compatibility policy, not a universally safe default.

For a library tested only with Angular 22, prefer a bounded range:

```json
{
  "peerDependencies": {
    "@angular/common": ">=22.0.0 <23.0.0",
    "@angular/core": ">=22.0.0 <23.0.0",
    "@angular/forms": ">=22.0.0 <23.0.0"
  }
}
```

Also decide whether Angular Material and CDK belong in `peerDependencies`
rather than `dependencies`. Peer dependencies usually avoid installing a
second framework copy and make the consumer's supported major explicit.

### Include the actual license text

`"license": "MIT"` in `package.json` is only an SPDX declaration. It does not
include the license terms.

Ng-packagr copies a `LICENSE` file located at the library project root. A
workspace-root license alone did not appear in this project's npm artifact, so
the license was added under the library root as well.

Verify the real package contents:

```bash
npx nx run my-library:build:production
cd dist/libs/my-library
npm pack --dry-run --json
```

Check for:

- `LICENSE`.
- Consumer-facing `README.md`.
- `package.json` with the correct version and peer ranges.
- FESM bundle and source map.
- Bundled declaration file.
- Required CSS, images, or other assets.
- No source tests, workspace configuration, or secrets.

## Dependency and audit review

After changing builders and packages, perform a clean install:

```bash
rm -rf node_modules
npm ci
npm ls --depth=0
npm audit --omit=dev
```

Use the workspace's approved clean-install procedure instead of deleting files
manually when automation or sandboxing applies.

Interpret audit output by dependency role. In this project, a remaining
high-severity development-server advisory came through
`@nx/angular -> @nx/module-federation -> http-proxy-middleware`. It was not part
of the published library artifact.

`@nx/angular` is workspace tooling and should normally be a `devDependency`.
Leaving build tools under `dependencies` inflates production audit results and
can make application-only tooling look like library runtime exposure.

Do not run `npm audit fix --force` during a framework migration. It can
downgrade or cross major versions to satisfy an advisory. Update the owning
framework package when a compatible fix exists.

## Build troubleshooting learned here

### Build stops at `Building...` without a diagnostic

The demo application's `index.html` loads Google Fonts. Angular's production
builder attempts to inline external font CSS. Under restricted network access,
the build stopped after `Building...` and Nx reported only a failed task.

The same build passed immediately with network access. If this occurs:

1. Inspect the application HTML and styles for external font URLs.
2. Re-run with network access to confirm the cause.
3. Prefer self-hosted fonts for deterministic CI, or disable font inlining if
   that matches the application's deployment policy.
4. Do not attribute a silent build exit to the source migration without
   isolating external build-time fetches.

### The local CLI rejects the Node version

Check both commands before debugging Angular code:

```bash
node --version
npx ng version
```

In this migration, Node 24.14.0 was below Angular CLI 22.0.6's engine floor;
Node 24.18.0 worked.

### `npm ci` still shows removed packages

An ordinary install can leave stale modules in `node_modules`. Regenerate the
lockfile and run a clean `npm ci`, then use `npm ls` to verify absence. Do not
use the physical contents of an old `node_modules` directory as evidence that
a dependency is still declared.

## CI and release sequence

The CI equivalent used by this workspace is:

```bash
npx nx affected -t lint test build
```

For the migration branch, also run all relevant projects without cache. Keep
the application build explicit because this workspace's local Angular builder
can terminate without a diagnostic when its progress renderer is enabled:

```bash
npx nx run-many -t lint --skip-nx-cache
npx nx run-many -t test --skip-nx-cache
npx nx run ngx-material-intl-tel-input-lib:build:production --skip-nx-cache
npx nx run ngx-material-intl-tel-input:build:production --skip-nx-cache --progress=false
```

The safe library release order is:

1. Merge the migration branch.
2. Wait for the merge commit's CI run to pass.
3. Confirm the npm version is not already published.
4. Confirm the Git tag does not already exist.
5. Tag the verified merge commit.
6. Push the tag and monitor the publish workflow.

This repository's publish workflow expects the bare package version, for
example `22.1.0`, not `v22.1.0`. It checks that the tag matches the library
package version before publishing with npm provenance.

## Final acceptance checklist

### Environment

- [ ] Node.js satisfies Angular 22's supported range.
- [ ] CI and local development use the same tested Node major/minor.
- [ ] TypeScript is `>=6.0.0 <6.1.0`.
- [ ] RxJS satisfies Angular and library peer requirements.

### Nx migration

- [ ] Migration manifest was reviewed before execution.
- [ ] Migrations were run one major at a time.
- [ ] Migration checkpoints are small enough to diagnose regressions.
- [ ] Temporary `migrations.json` and AI migration prompts were removed only
      after all migrations completed.

### TypeScript

- [ ] No permanent `ignoreDeprecations: "6.0"` remains without justification.
- [ ] `moduleResolution: "node"` was replaced appropriately.
- [ ] Strict mode and side-effect import checking are enabled or explicitly
      deferred with an issue.
- [ ] Ambient `types` are explicit in each build/test environment.
- [ ] `emitDecoratorMetadata` is removed unless a non-Angular dependency needs
      it.
- [ ] Project references and output paths remain correct.

### Angular

- [ ] Every generated `$safeNavigationMigration` wrapper was reviewed.
- [ ] Generated `Eager` change-detection overrides were reviewed.
- [ ] Zoneless compatibility was tested.
- [ ] `provideZonelessChangeDetection` was removed where it only restated the
      Angular v21+ default.
- [ ] `provideHttpClient` remains only where optional HTTP features are
      configured.
- [ ] Legacy animations were migrated or explicitly retained.
- [ ] `NgClass`/`NgStyle` cleanup follows project conventions.

### Build tooling

- [ ] Application, dev-server, and i18n targets use `@angular/build` where
      supported.
- [ ] Matching `targetDefaults` keys were updated.
- [ ] Deprecated `@angular-devkit/build-angular` was removed when unused.
- [ ] Deprecated `@angular/platform-browser-dynamic` was removed when unused.
- [ ] ESLint flat configurations preserve the intended effective rules.

### Tests and release

- [ ] Clean `npm ci` passes.
- [ ] Lint passes with zero errors.
- [ ] All tests pass without cache.
- [ ] All production builds pass without cache.
- [ ] Published library artifact passes `npm pack --dry-run` inspection.
- [ ] License and README are included in the artifact.
- [ ] Root, lockfile, library, changelog, README, and Git tag versions agree.
- [ ] Merge CI is green before the release tag is pushed.

## Reference links

- [Angular version compatibility](https://angular.dev/reference/versions)
- [Angular HttpClient setup](https://angular.dev/guide/http/setup)
- [Angular animations migration](https://angular.dev/guide/animations/migration)
- [Angular zoneless guide](https://angular.dev/guide/zoneless)
- [Angular component configuration](https://angular.dev/guide/components/advanced-configuration)
- [Angular application builder](https://angular.dev/tools/cli/build)
- [TypeScript 6 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html)
- [Nx advanced update process](https://nx.dev/docs/guides/tips-n-tricks/advanced-update)
- [Nx and the Angular CLI](https://nx.dev/docs/technologies/angular/guides/nx-and-angular)
- [Nx Angular migrations](https://nx.dev/docs/technologies/angular/migrations)
