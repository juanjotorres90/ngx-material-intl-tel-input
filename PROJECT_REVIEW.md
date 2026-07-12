# Project Review — ngx-material-intl-tel-input

Date: 2026-07-12 · Reviewed at commit `f059ecb` (develop) · Angular 21 / Nx 22.7

> **Status update (2026-07-12):** All findings below have been addressed in the working tree.
> Follow-up regression hardening also covers CVA write isolation, outer-control
> required validation, dynamic validator changes, partial NANP country retention,
> real too-long classification, legacy format values, and the MP cursor path.
>
> | #   | Finding                                                                                                                                                                                                                                                                                                                          | Status                               |
> | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
> | 1   | Real `ControlValueAccessor` + `Validator` implemented (`formControlName` now works; `fieldControl` deprecated but supported)                                                                                                                                                                                                     | ✅ Done                              |
> | 2   | Validator is pure; formatting/country-sync moved to the component's value-changes pipeline; inner error styling driven by an `ErrorStateMatcher`                                                                                                                                                                                 | ✅ Done                              |
> | 3   | `ControlContainer` injected `{ optional: true }`                                                                                                                                                                                                                                                                                 | ✅ Done                              |
> | 4   | Material/CDK/ngx-mat-select-search moved to `peerDependencies`                                                                                                                                                                                                                                                                   | ✅ Done                              |
> | 5   | Swapped `google-libphonenumber` → `libphonenumber-js` (lib-owned `PhoneNumberFormat` enum exported; area-code resolution now handled by the parser)                                                                                                                                                                              | ✅ Done                              |
> | 6   | `GEO_IP_CONFIG` injection token (custom URL + timeout), 3s default timeout, `HttpClient` optional, `autoIpLookup` now defaults to `false`, README privacy note. (Note: Angular 21 root-provides `HttpClient`, so the NullInjectorError scenario was moot — guard kept as defense.) Also fixed: `isLoading` stuck on geo-IP error | ✅ Done                              |
> | 7   | `mp` special case extracted to `requiresDialCode()`; Spain fallback now a `defaultCountry` input (default unchanged)                                                                                                                                                                                                             | ✅ Done                              |
> | 8   | `processCountries` takes an options object                                                                                                                                                                                                                                                                                       | ✅ Done                              |
> | 9   | `takeUntilDestroyed(DestroyRef)` everywhere, `allCountries` signal, `filteredCountries` computed (ReplaySubject/`_onDestroy`/`AsyncPipe` deleted). `setTimeout`s kept where they guard DOM timing                                                                                                                                | ✅ Done                              |
> | 10  | maxlength heuristic reduced to a cached lookup + flat buffer (~150 lines deleted)                                                                                                                                                                                                                                                | ✅ Done                              |
> | 11  | `aria-label` on select/input, decorative flags `aria-hidden`, hint/errors region linked via `aria-describedby`, errors `role="alert"`                                                                                                                                                                                            | ✅ Done                              |
> | 12  | SSR: browser-only work still behind timeouts/subscriptions; no regression (full `afterNextRender` migration deferred)                                                                                                                                                                                                            | ⚠️ Partial                           |
> | 13  | Coverage threshold (95/80/90/95) + lcov, Playwright e2e suite (4 specs, run in CI), publish dry-run step, dependabot                                                                                                                                                                                                             | ✅ Done                              |
> | 14  | tsconfig.base → es2022/bundler, docs corrected, `.gitignore` covers Playwright artifacts. Release automation not adopted (workflow decision left to maintainer)                                                                                                                                                                  | ✅ Done (partial on release tooling) |

Overall: a healthy, actively maintained library — strict TS, strictTemplates, OnPush, signals-based inputs, 111+ unit tests on the main component, tag-gated npm publish with provenance. The findings below are ordered by impact, not by count. The top four (P0) are the ones that separate "good" from "top notch": they affect correctness and every consumer's install.

---

## P0 — Correctness & public API

### 1. Not a real `ControlValueAccessor`

`NgxMaterialIntlTelInputComponent` implements only `OnInit, AfterViewInit, OnDestroy` (`ngx-material-intl-tel-input-lib.component.ts:85`). Forms integration is done through the custom `fieldControl` / `fieldControlName` inputs instead of the idiomatic `formControlName` / `ngModel` binding every other Angular form widget supports. (CLAUDE.md even claims CVA is implemented — it isn't.)

Consequences:

- Consumers can't write `<ngx-material-intl-tel-input formControlName="phone">` — the number-one expectation for a form component.
- The component mutates the consumer's control from the inside (`setValue`, `addValidators`, `markAsDirty`, `disable()`), inverting ownership. Two-way sync between `telForm` and `fieldControl` is maintained by three interlocking `valueChanges` subscriptions with `emitEvent: false` flags — the classic feedback-loop minefield.

**Fix:** implement `ControlValueAccessor` (+ `Validator` interface for the phone validation) and register via `NG_VALUE_ACCESSOR` / `NG_VALIDATORS`. Keep `fieldControl` working for one major version with a deprecation notice. This deletes most of the sync code: `writeValue`/`registerOnChange`/`setDisabledState` replace `startFieldControlValueChangesListener`, `startFieldControlStatusChangesListener`, and `setFieldControl`.

### 2. Validator with side effects

`TelValidators.isValidNumber` (`tel.validators.ts`) calls `setValue` and `setErrors` **10 times** inside the validator body. Validators must be pure functions; this one:

- Writes `numberControl`'s value during validation (formatting as a side effect of validating).
- Calls `control.setErrors(null)`, which **wipes errors set by any other validator** the consumer added (e.g. their own async validator). This is a real interop bug, not a style nit.
- Re-selects the country prefix from inside validation.

**Fix:** return the error map only. Move formatting/country-detection into the value-changes pipeline (or the future CVA `onChange`). Combine with `Validators.compose` semantics instead of `setErrors`.

### 3. `inject(ControlContainer)` is not optional

`ngx-material-intl-tel-input-lib.component.ts:91` injects `ControlContainer` without `{ optional: true }`. When the component is used standalone (passing `fieldControl` directly, no surrounding `[formGroup]`), there is no `ControlContainer` provider in the injector chain and this throws `NullInjectorError` at construction. Use `inject(ControlContainer, { optional: true, skipSelf: true })` and null-guard `setFieldControl`.

### 4. Packaging: Material/CDK as hard `dependencies`

`libs/ngx-material-intl-tel-input-lib/package.json` lists `@angular/material`, `@angular/cdk`, `angular-imask`, `ngx-mat-select-search`, `google-libphonenumber` under `dependencies` (with `allowedNonPeerDependencies: ["."]` silencing ng-packagr's warning). Angular Material and the CDK must be **peerDependencies**: as hard deps, a consumer on Material 21.0.x with the lib requesting `^21.1.x` can end up with two CDK copies — broken overlays, duplicated styles, silent DI mismatches. `ngx-mat-select-search` should also be a peer (it itself peers on Material). Keep `google-libphonenumber` and `angular-imask` as regular deps if you want them installed transitively — that's defensible — but the Angular-ecosystem packages must be peers.

---

## P1 — Consumer experience

### 5. Bundle weight: `google-libphonenumber`

`google-libphonenumber` is ~550 KB minified (~125 KB gzip), not tree-shakeable, and every consumer pays it. This is the most common complaint against intl-tel components. Options, best first:

- **`libphonenumber-js`**: ~110–145 KB min with selectable metadata sets (`/min`, `/mobile`, `/max`), same Google metadata, actively maintained. Covers parse/format/validate/length — everything this lib uses (`parse`, `format`, `isValidNumber`, `getExampleNumberForType`, length checks map to `validatePhoneNumberLength`).
- Lazy-load the phone engine: keep the input renderable immediately, dynamic-`import()` the validation module. More moving parts; only if staying on google-libphonenumber.

### 6. Geo-IP lookup: hardcoded third-party endpoint, hard `HttpClient` requirement

`geo-ip.service.ts` hardcodes `https://ipapi.co/json`. Issues:

- **Silent runtime failure mode**: `autoIpLookup` defaults to `true`, and `GeoIpService` injects `HttpClient`. A consumer who hasn't called `provideHttpClient()` gets a `NullInjectorError` from deep inside the component. Inject it `{ optional: true }` and degrade to `setAutoSelectedCountry()`.
- ipapi.co free tier is rate-limited (~1k/day per IP) — apps with real traffic will see failures; there's no timeout so a slow endpoint delays country selection.
- Privacy: the component ships user IPs to a third party by default. GDPR-conscious consumers need this documented and easy to disable/replace.

**Fix:** an `InjectionToken<GeoIpConfig>` (endpoint URL + response mapper, or a whole replacement function), a timeout (`timeout(3000)` in the pipe), and a README section on privacy + rate limits. Consider defaulting `autoIpLookup` to `false` in the next major.

### 7. Country-code special cases are scattered magic

`iso2 !== 'mp'` (Northern Mariana Islands) appears in three places (component `:413`, `:501`, validator), and the default country is hardcoded to Spain (`setAutoSelectedCountry`, `:530`). Extract the `mp` rule into one named helper (`requiresDialCodeInNational(iso2)` with a comment explaining _why_ MP is special), and make the fallback country an input with `'us'`-or-first-in-list default rather than an author-locale surprise.

### 8. `processCountries` takes 11 positional parameters

`fetchCountryData()` passes 11 positional args (`ngx-material-intl-tel-input-lib.component.ts:212-224`), mostly booleans. Any new option is a breaking signature change and call sites are unreadable. Replace with a single options object.

---

## P2 — Modernization & robustness

### 9. Mixed reactive paradigms

The component uses signals for inputs but 2018-era RxJS plumbing for lifecycle: `_onDestroy` Subject + `takeUntil` (6 subscriptions), `ReplaySubject` for `filteredCountries`, four `setTimeout` calls for timing (`:201`, `:456`, `:647`, plus focus). On Angular 21:

- `takeUntilDestroyed(this.destroyRef)` deletes the `_onDestroy` Subject and `ngOnDestroy`.
- `filteredCountries` is a pure derivation of `allCountries` + search text → a `computed()` (and `toSignal(prefixFilterCtrl.valueChanges)`), deleting the ReplaySubject and the `AsyncPipe`.
- `afterNextRender()` replaces the `setTimeout`-for-DOM-timing calls.
- `allCountries` is a plain mutable array read by signal-world code — make it a `signal<Country[]>` so the derivations above are actually reactive.

### 10. `getMaxInputLength` does libphonenumber work per change-detection cycle

It's an arrow function bound in the template; each call may run `getExampleNumberForType` for three number types (`:831-883`). OnPush limits the damage but it still runs on every CD of the component. Memoize per `(countryCode, formatted-validity)` or precompute per country at load. The three-tier buffer heuristic (`calculateFormattingBuffer` + `calculateSafetyMargin` + special cases) is ~150 lines to approximate "don't let the user type way too much" — consider replacing the whole thing with a single generous per-country cap (`baseMaxLength + 6`); the validator already catches too-long numbers exactly.

### 11. Accessibility

The template has **zero `aria-*` or `role` attributes**. Material primitives cover a lot (labels, error announcements), but a compound widget needs: an accessible name on the country `mat-select` (it currently reads as unlabeled or "Code"), `aria-describedby` linking hint/errors to the number input, and screen-reader text for the flag/dial-code. Run an axe pass on the demo app and add the missing wiring — this is table stakes for "top notch" and for enterprise adoption.

### 12. SSR safety

`setTimeout` DOM focus/cursor calls, IMask, and the auto geo-IP fetch all assume a browser. If SSR/hydration support is a goal (Angular 21 pushes it hard), gate browser-only work behind `afterNextRender`/`isPlatformBrowser` and document SSR behavior. If it's not a goal, say so in the README.

---

## P3 — Process, CI, and repo hygiene

### 13. CI gaps

`ci.yml` runs `nx affected -t lint test build` — good baseline. Missing:

- **Coverage gate**: jest outputs text coverage only (`jest.preset.js`), nothing enforces a floor. Add `coverageThreshold` and a `lcov` reporter + Codecov/Coveralls badge.
- **E2E**: zero end-to-end tests for a heavily DOM-interactive component (cursor repositioning, mask, dropdown search). One Playwright spec against the demo app covering type→format→validate→switch-country would catch the regressions unit tests can't (the cursor/`setTimeout` logic is untestable in jsdom).
- **Publish dry-run**: `publish.yml` verifies tag↔version (nice) but CI never runs `npm publish --dry-run`/`ng-packagr` pack checks on PRs, so packaging breaks are only discovered at release time.
- **Dependabot/Renovate**: no `.github/dependabot.yml`; Angular majors land on a clock, automate the bumps.

### 14. Repo hygiene

- `tsconfig.base.json` still has `target: es2015`, `moduleResolution: node`, decorator-metadata flags — project-level configs override it, but the base is stale; align with the lib's `es2022`/`bundler`.
- `dist/` and `tmp/` sit in the working tree — verify `.gitignore` covers both.
- CLAUDE.md/README claim `ControlValueAccessor` — fix docs or (better) fix the code (see #1).
- Root `version` (21.1.0) and lib version are duplicated and manually synced; the publish workflow guards it, but a release tool (release-please / nx release) would remove the manual step and generate the CHANGELOG.

---

## Suggested order of attack

| #   | Change                                                                    | Effort | Breaking?         |
| --- | ------------------------------------------------------------------------- | ------ | ----------------- |
| 1   | Material/CDK → peerDependencies (#4)                                      | S      | Patch-safe        |
| 2   | Optional `ControlContainer` + optional `HttpClient` (#3, #6)              | S      | No                |
| 3   | Pure validator (#2)                                                       | M      | Behavioral, minor |
| 4   | Geo-IP config token + timeout + docs (#6)                                 | S      | No                |
| 5   | CVA implementation, deprecate `fieldControl` (#1)                         | L      | Next major        |
| 6   | libphonenumber-js swap (#5)                                               | M      | Next major        |
| 7   | Signals/`takeUntilDestroyed` cleanup, `mp` helper, options object (#7–#9) | M      | No                |
| 8   | A11y wiring + axe check (#11)                                             | S–M    | No                |
| 9   | Playwright e2e + coverage gate + dependabot (#13)                         | M      | No                |

Items 1–4 fit in one minor release and remove the sharpest edges. Items 5–6 define the next major and are what makes the library competitive with `intl-tel-input`-based alternatives on bundle size and forms ergonomics.
