# Angular 22 Signal Forms Support Plan

This document defines how to add Angular 22 Signal Forms support to
`ngx-material-intl-tel-input` without breaking its existing Reactive Forms
consumers.

It began as an implementation plan and now also records the completed design.
The chosen approach adds the stable Signal Forms custom-control contract,
establishes one canonical value source, and retains the current Reactive Forms
integration during a measured compatibility period.

## Implementation status

Implemented for the additive `22.1.0` release. The shipped design keeps the
internal Reactive Forms controls while adding a native Angular 22 custom-control
boundary, a reusable Signal Forms schema, standard Reactive Forms bindings, and
standalone value binding.

The implementation also includes a development-mode error for conflicting
binding modes, deterministic native-binding precedence in production, logical
composite blur handling, schema-message precedence over `textLabels`, and a
DOM regression test for the dial-code feedback loop found during manual demo
testing.

## Executive recommendation

Implement `FormValueControl<string>` directly on
`NgxMaterialIntlTelInputComponent`.

The component should expose:

- A required `value = model<string>('')` property.
- Signal inputs for form-owned state such as `disabled`, `required`, `invalid`,
  `errors`, `touched`, and `name`.
- A `touch = output<void>()` event emitted when the telephone input loses
  focus.
- `focus()` and `reset()` methods that operate on the actual telephone input
  and internal controls.
- An exported Signal Forms validation schema for telephone-number validation.

Keep the internal `FormGroup`, `FormControl`, Angular Material controls, and
RxJS subscriptions in the first implementation. Signal Forms support concerns
the public boundary of the custom control; it does not require an immediate
rewrite of every internal control.

Do not add `ControlValueAccessor`. Angular explicitly says a component must not
implement both `ControlValueAccessor` and `FormValueControl`. This component
does not currently implement a CVA, so `FormValueControl` is the appropriate
contract.

## Angular 22 baseline

Signal Forms were introduced before Angular 22 and promoted to stable in
Angular 22. The public APIs used by this plan are exported from
`@angular/forms/signals` and are marked stable since v22.0.

No new npm package is required. This library already has `@angular/forms` as an
Angular peer dependency.

The relevant Angular 22 concepts are:

| API                   | Purpose                                              |
| --------------------- | ---------------------------------------------------- |
| `signal()`            | Holds the consumer's form model.                     |
| `form()`              | Creates a typed `FieldTree` around the model signal. |
| `FormField`           | Binds a field to a native or custom control.         |
| `FormValueControl<T>` | Contract for a custom control editing one value.     |
| `FormUiControl<T>`    | Optional UI state accepted by a custom control.      |
| `schema()`            | Defines reusable validation and field logic.         |
| `apply()`             | Composes a reusable schema into a consumer's form.   |
| `validate()`          | Adds a custom validation rule.                       |
| `compatForm()`        | Embeds Reactive Forms controls in a Signal Form.     |
| `SignalFormControl`   | Embeds Signal Forms state in a Reactive Form.        |

The primary integration for this library is `FormValueControl<string>`, not
`compatForm()` or `SignalFormControl`. Those compatibility APIs are useful to
application authors migrating larger forms, but the library can provide a
native custom-control contract directly.

## Current project assessment

### Workspace structure

The Nx workspace contains two projects:

- `ngx-material-intl-tel-input-lib`: publishable Angular library built with
  `@nx/angular:package`.
- `ngx-material-intl-tel-input`: demo application built with
  `@angular/build:application`.

Both use Jest. The demo is the correct place to exercise public Signal Forms
usage before publishing the feature.

### Current form-facing API

The component currently exposes these form-related inputs and outputs:

| Member               | Current role                                             |
| -------------------- | -------------------------------------------------------- |
| `fieldControl`       | Accepts a `FormControl` or `AbstractControl`.            |
| `fieldControlName`   | Looks up an external control through `ControlContainer`. |
| `initialValue`       | Seeds the internal and external controls.                |
| `required`           | Adds or removes `Validators.required`.                   |
| `disabled`           | Enables or disables internal and external controls.      |
| `numberValidation`   | Adds the custom telephone `ValidatorFn`.                 |
| `currentValue`       | Emits formatted telephone values.                        |
| `currentCountryCode` | Emits the selected dialing prefix.                       |
| `currentCountryISO`  | Emits the selected country ISO code.                     |

The demo currently uses:

```html
<form [formGroup]="formTestGroup">
  <ngx-material-intl-tel-input fieldControlName="phone"></ngx-material-intl-tel-input>
</form>
```

`fieldControlName` is a library-specific input. It is not Angular's
`formControlName` directive.

The component also injects `ControlContainer` as a required dependency. Native
Signal Forms and standalone `[(value)]` usage do not require a Reactive Forms
parent, so this injection must become optional before either mode can be
supported safely:

```typescript
private readonly controlContainer = inject(ControlContainer, {
  optional: true
});
```

Only the legacy `fieldControlName` adapter should read this container.

### Internal form architecture

The component owns a Reactive Forms group:

```typescript
telForm = new FormGroup({
  prefixCtrl: this.prefixCtrl,
  numberControl: new FormControl('')
});
```

It synchronizes this internal group with the external `fieldControl` through
`valueChanges` and `statusChanges` subscriptions. `TelValidators.isValidNumber`
also mutates the internal prefix and number controls while validating the
external control.

That architecture has three sources of value today:

1. `telForm.controls.numberControl` for the visible number.
2. `fieldControl` for the public formatted number.
3. `initialValue` for initialization.

Signal Forms support should not add a fourth independent source. The public
`value` model must become the canonical formatted value.

The default `fieldControl` is currently a newly created `FormControl`. Once
`value` exists, the legacy adapter should activate only when a consumer
explicitly supplies `fieldControl` or when `fieldControlName` resolves a parent
control. Otherwise the placeholder control would compete with Signal Forms for
value and state ownership.

### Current validation constraints

`TelValidators.isValidNumber()` is a Reactive Forms `ValidatorFn`. It also:

- Parses and formats the telephone value.
- Selects the country matching the dial code.
- Updates `telForm.controls.numberControl`.
- Sets `invalidNumber` and `numberTooLong` errors.

Signal Forms validation is declarative and schema-owned. A custom Signal Forms
control displays validation state but must not imperatively set errors on the
parent form. The parsing and validation logic therefore needs to be separated
from the Reactive Forms wrapper before native Signal Forms validation can be
offered cleanly.

## Target consumer APIs

### Native Signal Forms

The primary new usage should be:

```typescript
import { signal } from '@angular/core';
import {
  apply,
  form,
  FormField,
  required
} from '@angular/forms/signals';
import {
  NgxMaterialIntlTelInputComponent,
  telephoneNumberSchema
} from 'ngx-material-intl-tel-input';

interface ContactModel {
  phone: string;
}

readonly contactModel = signal<ContactModel>({ phone: '' });

readonly contactForm = form(this.contactModel, (path) => {
  required(path.phone, { message: 'Phone number is required' });
  apply(path.phone, telephoneNumberSchema());
});
```

```html
<ngx-material-intl-tel-input [formField]="contactForm.phone"></ngx-material-intl-tel-input>
```

The consuming standalone component imports `FormField` and
`NgxMaterialIntlTelInputComponent`.

### Standard Reactive Forms syntax

Angular 22 allows a `FormValueControl` custom component to be used by Reactive
Forms without a CVA. This should be verified and documented with the standard
Angular syntax:

```html
<form [formGroup]="contactForm">
  <ngx-material-intl-tel-input formControlName="phone"></ngx-material-intl-tel-input>
</form>
```

This is preferable to the library-specific `fieldControlName` API for new
Reactive Forms consumers.

### Existing Reactive Forms syntax

The existing syntax must remain supported in the first Signal Forms release:

```html
<ngx-material-intl-tel-input fieldControlName="phone"></ngx-material-intl-tel-input>
```

Also retain direct `fieldControl` binding:

```html
<ngx-material-intl-tel-input [fieldControl]="phoneControl"></ngx-material-intl-tel-input>
```

Deprecation should happen only after standard `formControlName` and
`[formControl]` compatibility are proven across the supported Angular range.

### Standalone value binding

The new value model should also support a form-independent use case:

```html
<ngx-material-intl-tel-input [(value)]="phone"></ngx-material-intl-tel-input>
```

This replaces `initialValue` plus `currentValue` for new standalone consumers.
Keep both legacy members during the compatibility period.

## Public contract design

### Minimal required contract

The target class shape is:

```typescript
import { input, model, output } from '@angular/core';
import { FormValueControl, ValidationError, WithOptionalFieldTree } from '@angular/forms/signals';

export class NgxMaterialIntlTelInputComponent implements FormValueControl<string> {
  readonly value = model<string>('');

  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly invalid = input<boolean>(false);
  readonly touched = input<boolean>(false);
  readonly dirty = input<boolean>(false);
  readonly name = input<string>('');
  readonly errors = input<readonly WithOptionalFieldTree<ValidationError>[]>([]);

  readonly touch = output<void>();
}
```

This is the intended end state. Existing `required` and `disabled` members are
currently model signals, so changing them to input signals may affect two-way
bindings. Review published usage before changing their signal kind. Keeping
them as models temporarily is acceptable if it satisfies the Angular
interface and preserves compatibility.

### State support priority

Implement these properties in the first release:

| Property          | Priority    | Component behavior                              |
| ----------------- | ----------- | ----------------------------------------------- |
| `value`           | Required    | Canonical formatted public telephone value.     |
| `disabled`        | Required    | Disables both internal controls.                |
| `required`        | Required    | Updates required indicators and attributes.     |
| `invalid`         | Required    | Drives invalid styling and accessibility state. |
| `errors`          | Required    | Selects the displayed error message.            |
| `touched`         | Required    | Controls when errors become visible.            |
| `dirty`           | Required    | Preserves existing dirty-based error behavior.  |
| `name`            | Required    | Applied to the actual telephone input.          |
| `touch`           | Required    | Emitted when the actual input blurs.            |
| `focus()`         | Required    | Focuses the actual telephone input.             |
| `reset()`         | Required    | Clears value and internal state consistently.   |
| `pending`         | Recommended | Allows async validation feedback later.         |
| `readonly`        | Recommended | Prevents editing without disabling the field.   |
| `hidden`          | Optional    | Prefer consumer control flow unless needed.     |
| `disabledReasons` | Optional    | Useful only if the UI displays a reason.        |

The prefix selector and telephone input represent one logical field. Focus,
touch, disabled, required, and error semantics must apply to the complete
control rather than only the inner text input.

### Value type

Use `string`, with `''` as the empty value.

Do not use `string | undefined`. In Signal Forms, `undefined` represents an
absent field in the model rather than an empty field. The component already
emits and stores empty strings, so `FormValueControl<string>` matches existing
behavior.

Changing to `string | null` would make resets resemble Reactive Forms more
closely, but it would expand the public value type and complicate formatting.
That should be a separate API decision, not part of initial Signal Forms
support.

### Canonical value flow

The target data flow is:

```text
Consumer field/model
        ⇅
component value model
        ⇅
format/parse synchronization layer
        ⇅
internal prefixCtrl + numberControl
        ⇅
Angular Material UI
```

Rules for this flow:

1. `value` is the canonical public formatted value.
2. Internal controls may hold a display-specific national number and country.
3. Consumer-to-component updates parse `value` and update internal controls
   without emitting a second public update.
4. User edits update internal controls, calculate the formatted public value,
   and set `value` once.
5. Compare normalized values before writing to prevent feedback loops.
6. `currentValue` emits from the same canonical update path.
7. Legacy `fieldControl` synchronization is an adapter around `value`, not an
   independent formatting pipeline.

Do not use a general `effect()` to mirror two writable value sources in both
directions. Prefer explicit event paths, `linkedSignal()` for display
transformation where appropriate, and equality guards at the adapter boundary.

### Binding-mode conflicts

Document that consumers must select one value-binding mode:

- `[formField]` for Signal Forms.
- `formControlName` or `[formControl]` for standard Reactive Forms.
- Legacy `fieldControlName` or `[fieldControl]` during compatibility.
- `[(value)]` for standalone use.

Using more than one mode on the same component is unsupported because multiple
owners can write the canonical value and state.

During development, consider a dev-mode assertion that reports conflicting
bindings. The `FORM_FIELD` token can identify a `[formField]` binding. Reactive
and legacy bindings can be detected from their directives or populated inputs.

Make `ControlContainer` optional and do not use its absence to infer Signal
Forms mode. A standalone `[(value)]` control also has no `ControlContainer`.
Binding mode should be derived from the actual directive or input that owns the
value.

## Validation architecture

### Extract a pure telephone analysis function

Move parsing, formatting, country resolution, and error classification into a
pure domain function. A possible result type is:

```typescript
export interface TelephoneAnalysis {
  readonly formattedValue: string;
  readonly displayValue: string;
  readonly country?: Country;
  readonly error?: 'invalidNumber' | 'numberTooLong';
}
```

The function should accept all required context explicitly:

```typescript
export interface TelephoneAnalysisOptions {
  readonly countries: readonly Country[];
  readonly selectedCountry?: Country | null;
  readonly includeDialCode: boolean;
  readonly outputNumberFormat: PhoneNumberFormat;
}
```

It must not:

- Call `setValue()`.
- Call `setErrors()`.
- Mark controls dirty or touched.
- Emit component outputs.
- Read component fields implicitly.

Both Reactive Forms and Signal Forms validators should delegate to this pure
function.

### Preserve the Reactive Forms validator

Keep `TelValidators.isValidNumber()` as the compatibility wrapper expected by
current consumers and component code. Refactor it to:

1. Read the Reactive Forms value and context.
2. Call the pure analysis function.
3. Return a standard Angular validation-error map.
4. Avoid changing other controls during validation where practical.

Any remaining synchronization side effects should move into the component's
value synchronization layer.

### Export a companion Signal Forms schema

Signal Forms custom controls display validation but do not own validation.
Export a reusable schema with the component:

```typescript
export function telephoneNumberSchema(options: TelephoneSchemaOptions = {}) {
  return schema<string>((path) => {
    validate(path, ({ value }) => {
      const result = analyzeTelephoneNumber(value(), options);

      if (!result.error) {
        return undefined;
      }

      return {
        kind: result.error,
        message: resolveTelephoneErrorMessage(result.error, options)
      };
    });
  });
}
```

The exact signature should be finalized during the pure-validator extraction.
The schema must be exported from the library public entry point.

Do not automatically add `required()` inside the telephone schema by default.
Requiredness is a form/business rule. Consumers should compose it explicitly:

```typescript
readonly contactForm = form(this.contactModel, (path) => {
  required(path.phone);
  apply(path.phone, telephoneNumberSchema());
});
```

An opt-in `required` schema option can be considered if repeated consumer code
justifies it.

### Error interoperability

The component currently recognizes these Reactive Forms error keys:

- `required`.
- `invalidNumber`.
- `numberTooLong`.

Use the same strings as Signal Forms `ValidationError.kind` values. This keeps
the component's labels and tests consistent across both systems.

Create a single computed error-view model that can read:

- Signal Forms `errors()` when `[formField]` is active.
- `fieldControl.errors` in legacy Reactive Forms mode.
- Standard Reactive Forms state supplied through the Angular adapter.

Do not display both sets or duplicate messages. Signal Forms error messages may
be consumer-defined, so prefer `error.message` when present and fall back to
the component's existing `textLabels` by `kind`.

### Required and disabled semantics

In Signal Forms:

- `required()` comes from a schema rule and is passed to the control.
- `disabled()` is derived from schema logic and is passed to the control.
- Disabled fields do not validate while disabled.
- Errors are derived; the control must not call `setErrors()`.

Therefore, in Signal Forms mode:

- `[required]` should be treated as presentation-only or rejected when no
  matching schema rule exists.
- `[disabled]` should disable the UI, but application form state should
  preferably derive disabled status in the schema.
- The component must not add or remove validators imperatively.

Retain the old imperative behavior only inside the legacy Reactive Forms
adapter until those APIs are deprecated.

### Status classes and invalid styling

Signal Forms does not add Reactive Forms status classes such as `ng-valid`,
`ng-invalid`, or `ng-dirty` automatically. Angular provides an optional global
`NG_STATUS_CLASSES` compatibility preset, but a reusable library control should
not require consumers to install a global provider just to render its error
border.

This component currently styles the filled control with:

```scss
&.ng-invalid.ng-dirty:not(.is-focused) {
  border: 1px solid var(--mat-theme-error, #f44336);
}
```

Add a component-owned native class binding driven by the unified state:

```html
<div class="tel-form" [class.is-invalid]="invalid() && (dirty() || touched())"></div>
```

Then style `.is-invalid` instead of depending on Angular directive classes.
Legacy mode should feed the same unified state from its `AbstractControl`.
Do not use `NgClass` for this migration.

## Internal implementation strategy

### Keep internal Reactive Forms initially

The component's prefix selector, search field, and number input are internal UI
implementation details. They integrate with Angular Material and
`ngx-mat-select-search`, both of which already work with Reactive Forms.

Keeping them reactive in the first release provides these advantages:

- Smaller public API change.
- Existing masking and cursor-position behavior remains intact.
- Existing tests remain valuable.
- Signal Forms integration can be tested independently from an internal
  rewrite.
- Failures can be attributed to the boundary adapter instead of a simultaneous
  rewrite of formatting, validation, Material selection, and search.

An internal Signal Forms rewrite may be evaluated later, but it is not required
to claim native Signal Forms custom-control support.

### Refactor synchronization before adding the contract

Create explicit methods around the canonical value:

```typescript
private applyPublicValue(value: string): void;
private updateValueFromInternalControls(): void;
private syncLegacyControlFromValue(value: string): void;
private syncValueFromLegacyControl(value: string | null): void;
```

Each method should be responsible for one direction and use equality checks.
This removes duplicate formatting from `startTelFormValueChangesListener()` and
`startFieldControlValueChangesListener()`.

The current constructor `effect()` calls methods that mutate the external
Reactive control's validators and disabled state. Remove that external mutation
from the general component effect. If an effect remains necessary to adapt
Signal inputs to the internal Reactive `telForm`, keep it one-directional and
strictly internal. Form-owned Signal state must not be written back by that
effect.

Use `DestroyRef` with `takeUntilDestroyed()` when touching these subscriptions.
The component currently owns `_onDestroy`; replacing it is a separate cleanup
that fits naturally with this synchronization refactor but is not required for
Signal Forms functionality.

### Touch and focus behavior

Change the blur handler to notify every active adapter:

```typescript
onInputBlur(): void {
  this.isFocused.set(false);
  this.touch.emit();
  this.fieldControl()?.markAsTouched();
}
```

The legacy call should occur only in legacy mode. `touch.emit()` is required so
Signal Forms marks the field touched and so `debounce(path, 'blur')` works.

Implement focus against the actual input:

```typescript
focus(options?: FocusOptions): void {
  this.numberInput()?.nativeElement.focus(options);
}
```

Consider focus transitions between the country selector and telephone input.
The logical control should become touched when focus leaves the whole
component, not merely when the user moves from the selector to the number
input. A focus-within check may be required for correct composite-control
semantics.

### Reset behavior

`reset()` must define and test all of these outcomes:

- Public `value` becomes `''`.
- Visible number becomes empty.
- Country selection follows the configured default behavior.
- Dirty and touched UI state is cleared.
- Validation messages are hidden until the next interaction.
- No auto-IP lookup is triggered unless the existing configuration explicitly
  requires it.
- Exactly one public value update is produced.

Resetting through the parent Signal Form must also update the component. Test
both `field().value.set('')` and form-level reset APIs supported by Angular 22.

### Accessibility

Signal Forms support must preserve or improve:

- `name` on the actual telephone input.
- `aria-required` and native `required` state.
- `aria-invalid` based on Signal Forms or Reactive Forms state.
- `aria-describedby` associations for hints and errors.
- Focus delegation from the form field to the number input.
- Disabled and readonly behavior for both the selector and number input.
- Error announcements without duplicate `mat-error` nodes.

The existing component is composite UI wrapped around two Material form
fields. Test keyboard navigation and screen-reader semantics rather than
assuming `FormValueControl` alone provides them.

## Public API compatibility policy

### Keep in the first release

- `fieldControl`.
- `fieldControlName`.
- `initialValue`.
- `currentValue`.
- `required`.
- `disabled`.
- `numberValidation`.
- All country and formatting inputs.
- `currentCountryCode` and `currentCountryISO`.

### Add in the first release

- `value` and generated `valueChange`.
- `FormValueControl<string>` implementation.
- Signal Forms state inputs and `touch` output.
- `focus()` and `reset()`.
- `telephoneNumberSchema()` and its option/result types.
- Signal Forms demo and README examples.

### Candidate deprecations for a later major

- `fieldControlName`, after standard `formControlName` is proven.
- `fieldControl`, after `[formControl]` is proven.
- `initialValue`, in favor of `value`.
- `currentValue`, in favor of `valueChange`.
- Component-owned `numberValidation`, in favor of the exported schema.

Do not deprecate these in the first implementation unless the release is
already planned as a major with a documented migration path.

## Implementation phases

### Phase 0: Baseline and contract tests

Before refactoring:

1. Record the library test count and coverage.
2. Add integration tests for existing `fieldControl` and `fieldControlName`
   behavior if any important path is covered only by method-level mocks.
3. Record formatting behavior for all `PhoneNumberFormat` options.
4. Record reset, required, disabled, invalid, and programmatic-update behavior.
5. Add a host component using the current public API rather than directly
   mutating component internals.

Exit condition: current behavior is protected by consumer-level tests.

### Phase 1: Pure telephone domain logic

1. Extract telephone analysis from `TelValidators`.
2. Add focused unit tests for valid, invalid, too-long, empty, shared-dial-code,
   and area-code cases.
3. Make the Reactive `ValidatorFn` delegate to the pure function.
4. Move side effects into explicit component synchronization code.
5. Confirm all existing tests and production builds pass.

Exit condition: validation can be called without a component or
`AbstractControl`.

### Phase 2: Canonical value model

1. Add `value = model<string>('')`.
2. Route user edits through one value-update method.
3. Route programmatic value changes through one internal-update method.
4. Bridge `initialValue`, `currentValue`, and legacy controls to `value`.
5. Add loop prevention and single-emission assertions.

Exit condition: all binding modes use one canonical public value.

### Phase 3: Implement `FormValueControl`

1. Implement `FormValueControl<string>`.
2. Make `ControlContainer` optional.
3. Activate the legacy adapter only for an explicitly supplied or resolved
   external control.
4. Add the state inputs needed by the template.
5. Emit `touch` on logical-control blur.
6. Implement `focus()` and `reset()`.
7. Update required, disabled, invalid, and error rendering to use a unified
   view model.
8. Replace reliance on `ng-invalid.ng-dirty` with native class bindings.
9. Add `name` and ARIA propagation.

Exit condition: `[formField]` supports model-to-view, view-to-model, state,
focus, blur, reset, and error display.

### Phase 4: Export Signal Forms validation

1. Add `telephoneNumberSchema()`.
2. Use existing error kinds.
3. Support configuration necessary to match component formatting.
4. Export the schema and public option types from `src/index.ts`.
5. Add isolated schema tests with an explicit Angular injector.

Exit condition: a consumer can make the Signal Form field invalid without
using Reactive Forms validators or component-owned error mutation.

### Phase 5: Demo all supported modes

Split the demo into focused examples:

1. Native Signal Forms using `[formField]`.
2. Standard Reactive Forms using `formControlName`.
3. Legacy Reactive Forms using `fieldControlName` during compatibility.
4. Standalone two-way `[(value)]` binding.

The Signal Forms example should demonstrate:

- Required validation.
- Telephone-number schema validation.
- Programmatic model update.
- Reset.
- Disabled schema state.
- Submission.
- Display of the canonical model value.

Exit condition: documentation examples are executable in the repository.

### Phase 6: Documentation and release

1. Add a README Signal Forms section before the legacy API section.
2. Document that consumers import `FormField` from
   `@angular/forms/signals`.
3. Document the companion schema and error kinds.
4. Add a compatibility table for Angular 22 Signal, Reactive, legacy, and
   standalone binding modes.
5. Add a changelog entry describing the additive API.
6. Inspect the packed declarations to ensure Signal Forms types are public.
7. Verify peer dependencies still require Angular 22 or later.

Exit condition: the npm artifact contains the new declarations and every
published example compiles.

## Test plan

### Pure validation tests

Keep these tests independent of TestBed where possible:

- Empty string is valid unless the consumer adds `required()`.
- Valid international number has no telephone error.
- Invalid number returns `invalidNumber`.
- Excessive number length returns `numberTooLong`.
- Shared dial codes select the correct country using area codes.
- Output format does not alter validity.
- Parsing failure never throws into the form runtime.

### Signal schema tests

Signal Forms requires an injection context. Create the form with an explicit
injector or inside `TestBed.runInInjectionContext()`.

Test:

- The field begins valid for `''` without `required()`.
- Composed `required()` produces a `required` error.
- The telephone schema produces the expected error kind and message.
- Setting a valid model value clears errors synchronously.
- Disabled fields skip validation.
- Consumer validators compose with the telephone schema.

### Component-bound Signal Forms tests

Use a small host component with a real `[formField]` binding. Avoid mocking the
Signal Forms directive.

Test both directions:

- Model value initializes the visible number and country.
- User typing updates the model signal.
- Programmatic `.value.set()` updates the UI.
- Selecting a country updates the canonical value once.
- Formatting does not create a write loop.
- `touch` marks the field touched on logical blur.
- `debounce(path, 'blur')` updates only after blur.
- Required state reaches the inner input and selector.
- Disabled state disables both internal controls.
- Signal validation errors render the correct message.
- Consumer-provided error messages override fallback labels.
- `focus()` focuses the telephone input.
- Parent reset clears public and internal state.
- `name` and ARIA attributes reach the native input.

After DOM interactions, use `await fixture.whenStable()` before asserting
Signal Forms state.

### Reactive Forms compatibility tests

Maintain separate host tests for:

- `formControlName` on the component.
- `[formControl]` on the component.
- Legacy `fieldControlName`.
- Legacy `[fieldControl]`.
- Reactive required and telephone validation.
- Parent `disable()`, `enable()`, `reset()`, `setValue()`, and `patchValue()`.
- Dirty, touched, pending, valid, and invalid transitions.

This is more valuable than testing private listener methods with mocked
controls because it verifies the Angular directive integration consumers use.

### Regression tests

Retain or add coverage for:

- Masked and unmasked entry.
- Include-dial-code modes.
- Every supported output format.
- Country localization and filtering.
- Preferred, visible, and excluded countries.
- Auto-selection and explicit `autoIpLookup` opt-in.
- Cursor preservation during formatting.
- Geo-IP failure fallback.
- Empty and malformed initial values.
- Phone link rendering only for valid values.

## Nx verification commands

Use Nx targets throughout implementation:

```bash
npx nx test ngx-material-intl-tel-input-lib --skip-nx-cache
npx nx test ngx-material-intl-tel-input --skip-nx-cache
npx nx lint ngx-material-intl-tel-input-lib
npx nx lint ngx-material-intl-tel-input
npx nx build ngx-material-intl-tel-input-lib --configuration=production
npx nx build ngx-material-intl-tel-input --configuration=production --progress=false
```

Run the complete release gate. Keep the application build explicit because
this workspace's local Angular builder can terminate without a diagnostic when
its progress renderer is enabled:

```bash
npx nx run-many -t lint --skip-nx-cache
npx nx run-many -t test --skip-nx-cache
npx nx run ngx-material-intl-tel-input-lib:build:production --skip-nx-cache
npx nx run ngx-material-intl-tel-input:build:production --skip-nx-cache --progress=false
```

Inspect the package:

```bash
cd dist/libs/ngx-material-intl-tel-input-lib
npm pack --dry-run --json
```

The packed declaration files must reference only public Angular 22 APIs and
must include the exported telephone schema types.

## Release strategy

Native Signal Forms support is additive if all existing inputs and behavior
remain compatible. It can therefore ship in a minor release under semantic
versioning.

Treat the following as breaking and defer them to a major release:

- Removing `fieldControl` or `fieldControlName`.
- Replacing `initialValue` with `value` without an alias period.
- Removing `currentValue`.
- Changing the empty value from `''` to `null`.
- Moving all validation responsibility to consumers without retaining the
  existing Reactive Forms behavior.
- Changing default formatting or country-selection behavior.

Because Signal Forms are stable only from Angular 22, the feature should not be
backported to an artifact that claims compatibility with Angular 21 unless it
is compiled and tested against Angular 21's earlier API status deliberately.

## Risks and mitigations

| Risk                                         | Impact                               | Mitigation                                                        |
| -------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------- |
| Multiple value sources create loops.         | Duplicate events or stack recursion. | Canonical `value`, directional methods, equality guards.          |
| Validation still mutates controls.           | Unpredictable schema evaluation.     | Extract a pure analysis function first.                           |
| Signal and Reactive modes conflict.          | State ownership becomes ambiguous.   | Support one binding mode per instance and report conflicts.       |
| Required `ControlContainer` has no provider. | Signal or standalone creation fails. | Make injection optional and isolate it to the legacy adapter.     |
| Disabled state is written both ways.         | Parent and component disagree.       | Form owns state in Signal mode; legacy adapter owns old behavior. |
| Blur fires while moving inside the control.  | Field becomes touched too early.     | Track focus across the composite component.                       |
| Existing outputs emit more than once.        | Consumer side effects repeat.        | Emit only from the canonical value commit.                        |
| Error kinds diverge by form system.          | Different UI and documentation.      | Reuse `required`, `invalidNumber`, and `numberTooLong`.           |
| CSS expects Reactive status classes.         | Signal errors lack invalid styling.  | Bind a native `is-invalid` class from unified signal state.       |
| Internal rewrite expands scope.              | Formatting and Material regressions. | Keep internal Reactive Forms for the first release.               |
| Public Angular types leak incorrectly.       | Consumer compilation failure.        | Build and inspect packed declarations.                            |
| Method-level mocks hide integration bugs.    | Tests pass while templates fail.     | Add real Signal and Reactive host components.                     |

## Implementation decisions

1. The public value contract is `string`, with `''` as the empty value.
2. `value` is canonical, while `initialValue` and `currentValue` remain fully
   supported with no deprecation in this release.
3. Internal Reactive Forms remain in place.
4. Signal Forms, standard Reactive Forms, legacy Reactive Forms, and standalone
   binding ship together.
5. `required` and `disabled` remain model signals for compatibility.
6. `telephoneNumberSchema()` accepts optional messages keyed by
   `invalidNumber` and `numberTooLong`. A schema message wins over the matching
   `textLabels` fallback.
7. The control becomes touched only after focus leaves the complete composite,
   including the country selector.
8. Conflicting native and legacy bindings throw in development. Native Angular
   bindings take deterministic precedence in production.
9. Signal Forms support first ships in `22.1.0`.

## Acceptance checklist

### Contract

- [x] Component implements `FormValueControl<string>`.
- [x] `value` is the only canonical public value source.
- [x] Empty value is documented as `''`.
- [x] Component does not implement `ControlValueAccessor`.
- [x] Signal state inputs use Angular 22 public APIs only.
- [x] `ControlContainer` is optional and used only by the legacy adapter.

### Signal Forms behavior

- [x] `[formField]` works in both directions.
- [x] Required, disabled, invalid, touched, dirty, and errors are reflected.
- [x] Invalid styling does not depend on automatic `ng-*` status classes.
- [x] Blur emits `touch` with correct composite-focus semantics.
- [x] `debounce('blur')` works.
- [x] `focus()` and `reset()` work from the form system.
- [x] Programmatic model updates preserve formatting and country selection.
- [x] No feedback loop or duplicate value event occurs.

### Validation

- [x] Parsing and validation core is pure.
- [x] Reactive validator delegates to the pure core.
- [x] Companion Signal Forms schema is exported.
- [x] Schema composes with `required()` and consumer rules.
- [x] Signal errors use stable documented kinds.
- [x] Component displays consumer messages with label fallbacks.

### Compatibility

- [x] Standard `formControlName` and `[formControl]` work.
- [x] Legacy `fieldControlName` and `[fieldControl]` still work.
- [x] `initialValue` and `currentValue` remain compatible.
- [x] Existing formatting, masking, selection, and Geo-IP behavior passes.
- [x] Multiple binding modes are documented as unsupported.

### Quality and release

- [x] Signal schema unit tests pass.
- [x] Signal host integration tests pass.
- [x] Reactive compatibility host tests pass.
- [x] Both Nx lint targets pass with zero errors.
- [x] Both Nx test targets pass without cache.
- [x] Both production builds pass without cache.
- [x] README examples compile in the demo application.
- [x] Packed declarations expose the intended public types.
- [x] Changelog and compatibility table describe the feature.

## Official references

- [Signal Forms overview](https://angular.dev/guide/forms/signals/overview)
- [Signal Forms custom controls](https://angular.dev/guide/forms/signals/custom-controls)
- [Migrating from Reactive Forms](https://angular.dev/guide/forms/signals/migration)
- [Signal Forms validation](https://angular.dev/guide/forms/signals/validation)
- [Testing Signal Forms](https://angular.dev/guide/forms/signals/testing)
- [Comparison with other form systems](https://angular.dev/guide/forms/signals/comparison)
- [`FormValueControl` API](https://angular.dev/api/forms/signals/FormValueControl)
- [`FormUiControl` API](https://angular.dev/api/forms/signals/FormUiControl)
- [`form()` API](https://angular.dev/api/forms/signals/form)
- [Angular roadmap](https://angular.dev/roadmap)
