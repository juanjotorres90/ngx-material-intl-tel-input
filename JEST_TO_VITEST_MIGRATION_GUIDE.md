# Jest to Vitest migration guide

A project-tested playbook for migrating Angular tests from Jest
(`jest-preset-angular` and `@nx/jest`) to Vitest with Angular's
`@angular/build:unit-test` builder. The constraints below were encountered in
this Angular 22/Nx 23 workspace, which contains a publishable library and a
demo application.

Applies directly to Angular 22, Nx 23, Vitest 4, and TypeScript 6. Most of the
guide also applies to Angular 21/Nx 22.

---

## Repository result

This repository uses:

- explicit `test` targets with `@angular/build:unit-test`;
- `@angular/build:ng-packagr` for the publishable library;
- Vitest globals from `vitest/globals`;
- V8 coverage through `@vitest/coverage-v8`; and
- Nx caching for executor-based test targets.

The current configuration lives in `nx.json`, each project's `project.json`,
and `tsconfig.spec.json`.

## 1. Choose the runner first

| Option                           | Executor                                      | Pros                                                                                | Cons                                                                                                                                                    |
| -------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`vitest-angular`** (used here) | `@angular/build:unit-test`                    | Official Angular tooling, no AnalogJS dependency, zone `fakeAsync` support built in | Still experimental; executor-based (no Nx-inferred target); **no `vi.mock` on relative imports**; libraries must build with `@angular/build:ng-packagr` |
| `vitest-analog` (Nx default)     | `@nx/vitest` inferred from `vitest.config.ts` | Full Nx task inference/caching, plain vitest config, `vi.mock` works                | Extra deps (`@analogjs/vite-plugin-angular`), not the official Angular runner                                                                           |

If you pick `vitest-angular` for a **publishable library**, its `build` target must move from `@nx/angular:package` to `@angular/build:ng-packagr` — the unit-test builder rejects `@nx/angular:package` and Nx closed the issue as not-planned ([nrwl/nx#34456](https://github.com/nrwl/nx/issues/34456)). Both wrap ng-packagr; verify the dist output is identical (see §9).

> Known bug: `nx g vitest` fails with _"Target 'test' already exists"_ when the Jest target is still present ([nrwl/nx#34608](https://github.com/nrwl/nx/issues/34608)). The manual steps below sidestep the generator entirely.

## 2. Dependencies

```bash
npm i -D vitest jsdom @vitest/coverage-v8
npm rm jest jest-environment-jsdom jest-preset-angular ts-jest @types/jest @nx/jest
```

Check `node_modules/@angular/build/package.json` `peerDependencies` for the exact supported Vitest major (Angular 22 → `vitest ^4.0.8`).

## 3. `nx.json`

- **Remove** the `@nx/jest/plugin` entry from `plugins` (this deletes the inferred jest `test` target).
- Generator defaults: `"unitTestRunner": "jest"` → `"vitest-angular"` for `@nx/angular:application` and `@nx/angular:library`.
- `namedInputs.production`: drop `!{projectRoot}/jest.config.[jt]s` and test-setup exclusions.
- Executor-based targets are not cached automatically — add:

```jsonc
"targetDefaults": {
  "test": { "cache": true, "inputs": ["default", "^production"] },
  "@angular/build:ng-packagr": {
    "cache": true,
    "dependsOn": ["^build"],
    "inputs": ["production", "^production"]
  }
}
```

## 4. `project.json` targets

Per project, add an explicit test target (target name `test` keeps CI / `nx affected -t test` working unchanged):

```jsonc
"test": {
  "executor": "@angular/build:unit-test",
  "options": {
    "tsConfig": "<projectRoot>/tsconfig.spec.json",
    "buildTarget": "<project-name>::development"
  }
}
```

For a publishable library, also swap the build executor:

```diff
-"executor": "@nx/angular:package",
+"executor": "@angular/build:ng-packagr",
```

(options `project`/`tsConfig`/configurations map 1:1).

Useful builder options (see the schema for the full list): `filter` (run tests matching a name), `include` (spec file globs), `coverage`, `coverageReporters`, `setupFiles`, `runnerConfig`, `watch`.

## 5. Delete Jest scaffolding

- Root `jest.config.ts` and `jest.preset.js`
- Per-project `jest.config.ts`
- Per-project `src/test-setup.ts` — the builder initializes TestBed + zone testing itself; `setupZoneTestEnv()` from jest-preset-angular has no equivalent needed. If you relied on `errorOnUnknownElements`/`errorOnUnknownProperties`, re-add via the builder's `setupFiles`/`providersFile`.

## 6. `tsconfig` changes

`tsconfig.spec.json` per project:

```diff
-    "target": "es2016",
-    "types": ["jest", "node"],
+    "types": ["vitest/globals", "node"],
```

- **Drop any `target` override** — inherit `es2022` from the project tsconfig. The Angular CLI forces ES2022 anyway and prints a warning for every mismatched spec tsconfig.
- Remove `jest.config.ts` from `include` and `src/test-setup.ts` from `files`.
- Also sweep `tsconfig.lib.json` / `tsconfig.app.json` / `tsconfig.editor.json` `exclude` arrays for `jest.config.ts` references.
- `.vscode/extensions.json`: replace `firsttris.vscode-jest-runner` with `vitest.explorer`.

## 7. Sweep spec files

The API is ~99% compatible. Mechanical replacements:

| Jest                                                                     | Vitest                                                                                        |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `jest.fn` / `jest.spyOn` / `jest.clearAllMocks` / `jest.restoreAllMocks` | same name on `vi.`                                                                            |
| `jest.useFakeTimers` / `useRealTimers` / `advanceTimersByTime`           | same name on `vi.`                                                                            |
| `jest.Mocked<T>` / `jest.MockedFunction<T>`                              | `import type { Mocked, MockedFunction, MockInstance } from 'vitest'`                          |
| `it('...', (done) => ...)`                                               | `async` + `await new Promise((r) => setTimeout(r, n))` — **`done` callbacks are unsupported** |

Watch for prettier-wrapped bare `jest` tokens at end-of-line (`jest\n  .spyOn(...)`) — a plain `jest.` → `vi.` replace misses them. (If scripting on macOS: BSD `sed` does not support `\b`.)

### Rules that will bite you

1. **Do NOT import `describe`/`it`/`beforeEach`/`expect`/`vi` from `'vitest'`.** They are globals (`types: ["vitest/globals"]`); importing the real ones bypasses the zone patching and silently breaks `fakeAsync`. _Type-only_ imports are fine.

2. **`vi.mock()` on relative imports is rejected by the Angular builder** with _"vi.mock and related methods are not supported for relative imports"_. Alternatives, in order of preference:
   - **Angular DI**: mock services via TestBed providers.
   - **Prototype spies** for class-based deps (works even bundled): `vi.spyOn(PhoneNumberUtil.prototype, 'parse').mockReturnValue(...)`.
   - **Object-call seam** for free functions. Namespace spying (`import * as utils` + `vi.spyOn(utils, 'fn')`) does NOT work — esbuild inlines the call to a direct reference. Instead export a plain object from the module and call through it:

     ```ts
     // utils.ts — keeps named exports for normal consumers
     export const phoneNumberUtils = { getMaxPhoneNumberLength, isValidPhoneNumberLength };

     // consumer.ts
     import { phoneNumberUtils } from './utils';
     phoneNumberUtils.isValidPhoneNumberLength(value, iso);

     // spec — spying on a shared object survives bundling
     vi.spyOn(phoneNumberUtils, 'isValidPhoneNumberLength').mockReturnValue(false);
     ```

3. **Vitest 4 forbids `mockReturnValue` on mocks invoked with `new`** (`Cannot use 'mockReturnValue' when called with 'new'`) — common when mocking constructables like `Intl.DisplayNames`. Arrow implementations also fail (`not a constructor`). Use a regular `function`:

   ```ts
   // ❌ throws under new:  vi.fn().mockReturnValue(instance)
   // ❌ throws under new:  vi.fn(() => instance)
   const factory = vi.fn(function () {
     return instance;
   });
   globalThis.Intl.DisplayNames = factory; // new Intl.DisplayNames(...) → instance
   ```

## 8. Failures Jest may have hidden

Vitest reports **unhandled async errors** as file-level failures; Jest silently swallowed them. In practice these pointed at genuine defects:

- **Uncancelled timers**: an `ngOnInit` `setTimeout` never cleared in `ngOnDestroy` fired after test teardown against destroyed/mocked state. Fix at the root — store the id, `clearTimeout` in `ngOnDestroy`. If a spec replaces component internals with mocks mid-lifecycle, call `component.ngOnDestroy()` in that `beforeEach` first.
- **`.not.toThrow()` lies for RxJS callbacks**: RxJS 7 rethrows subscriber-callback errors _asynchronously_, so a test asserting "handles missing X gracefully" passed under Jest while the code actually crashed. Vitest surfaces the crash — fix the code (add the guard the test claims exists), not the test.

## 9. Verification checklist

```bash
npx nx test <lib>
npx nx test <app>
npx nx test <lib> --coverage
npx nx build <lib>
npx nx build <app>
npx nx lint <lib>
npx nx lint <app>

rg -n -i 'jest|jest-preset-angular|@nx/jest' \
  --glob '!node_modules/**' \
  --glob '!package-lock.json' \
  --glob '!CHANGELOG.md' .
```

- **If you swapped the lib's build executor**: build once with the old executor first, snapshot `dist/`, and diff after the swap — the ng-packagr output should be byte-identical (modulo your own source changes) before the next npm publish.
- CI needs no changes if targets keep the name `test` (`nx affected -t lint test build`).
- Update docs that mention Jest: `CLAUDE.md`/`AGENTS.md`/copilot instructions, READMEs, contributor guides — including any embedded `jest.mock` example snippets, which must be rewritten to TestBed/spy patterns (rule 2 above).

## 10. Coverage notes (if you chase 100%)

- Text summary truncates uncovered line lists; use `--coverageReporters=lcov` (or `json`) and read exact `DA`/`BRDA`/`FNDA` records.
- Coverage includes **templates** (`component.html` gets its own row). Template branches need DOM tests: `fixture.componentRef.setInput(...)`, dispatch real `focus`/`blur` events, and open `MatSelect` via `component.singleSelect()?.open()` to render lazy options.
- `mat-select-trigger` content only renders when the selection matches an option; after replacing the options list, selection re-initializes **in a microtask** — make the test `async` and `await Promise.resolve()` between `detectChanges()` calls.
- Components with constructor `effect()`s that call `control.enable()` recompute validity on every effect run, wiping manually-set errors (`setErrors`). Produce error states through **validators** in tests, not `setErrors`.
- Expect a possible residual "function" v8 maps onto a `viewChild('...')` locator string — a compiler-generated query artifact, not authored code. `/* v8 ignore */` comments do **not** survive esbuild bundling (even with `-- @preserve` the mapping misfires), so document it and move on rather than distort real numbers.

## 11. Order of operations

1. Baseline: build the lib with the old executor, snapshot `dist/`.
2. Swap dependencies (§2), `npm install`.
3. `nx.json` (§3) → `project.json` targets (§4) → delete Jest files (§5) → tsconfigs (§6).
4. Spec sweep (§7): `jest.` → `vi.`, type imports, `done` callbacks, then fix the `vi.mock`/constructor-mock cases individually.
5. Run tests; treat every unhandled async error as a product bug lead (§8).
6. Verify (§9), diff the lib dist, update docs.
