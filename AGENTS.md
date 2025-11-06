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

---

# Angular Best Practices

This project adheres to modern Angular best practices, emphasizing maintainability, performance, accessibility, and scalability.

## TypeScript Best Practices

- **Strict Type Checking:** Always enable and adhere to strict type checking. This helps catch errors early and improves code quality.
- **Prefer Type Inference:** Allow TypeScript to infer types when they are obvious from the context. This reduces verbosity while maintaining type safety.
  - **Bad:**
    ```typescript
    let name: string = 'Angular';
    ```
  - **Good:**
    ```typescript
    let name = 'Angular';
    ```
- **Avoid `any`:** Do not use the `any` type unless absolutely necessary as it bypasses type checking. Prefer `unknown` when a type is uncertain and you need to handle it safely.

## Angular Best Practices

- **Standalone Components:** Always use standalone components, directives, and pipes. Avoid using `NgModules` for new features or refactoring existing ones.
- **Implicit Standalone:** When creating standalone components, you do not need to explicitly set `standalone: true` inside the `@Component`, `@Directive` and `@Pipe` decorators, as it is implied by default.
  - **Bad:**
    ```typescript
    @Component({
      standalone: true
      // ...
    })
    export class MyComponent {}
    ```
  - **Good:**
    ```typescript
    @Component({
      // `standalone: true` is implied
      // ...
    })
    export class MyComponent {}
    ```
- **Signals for State Management:** Utilize Angular Signals for reactive state management within components and services.
- **Lazy Loading:** Implement lazy loading for feature routes to improve initial load times of your application.
- **NgOptimizedImage:** Use `NgOptimizedImage` for all static images to automatically optimize image loading and performance.
- **Host bindings:** Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead.

## Components

- **Single Responsibility:** Keep components small, focused, and responsible for a single piece of functionality.
- **`input()` and `output()` Functions:** Prefer `input()` and `output()` functions over the `@Input()` and `@Output()` decorators for defining component inputs and outputs.
  - **Old Decorator Syntax:**
    ```typescript
    @Input() userId!: string;
    @Output() userSelected = new EventEmitter<string>();
    ```
  - **New Function Syntax:**

    ```typescript
    import { input, output } from '@angular/core';

    // ...
    userId = input<string>('');
    userSelected = output<string>();
    ```

- **`computed()` for Derived State:** Use the `computed()` function from `@angular/core` for derived state based on signals.
- **`ChangeDetectionStrategy.OnPush`:** Always set `changeDetection: ChangeDetectionStrategy.OnPush` in the `@Component` decorator for performance benefits by reducing unnecessary change detection cycles.
- **Inline Templates:** Prefer inline templates (template: `...`) for small components to keep related code together. For larger templates, use external HTML files.
- **Reactive Forms:** Prefer Reactive forms over Template-driven forms for complex forms, validation, and dynamic controls due to their explicit, immutable, and synchronous nature.
- **No `ngClass` / `NgClass`:** Do not use the `ngClass` directive. Instead, use native `class` bindings for conditional styling.
  - **Bad:**
    ```html
    <section [ngClass]="{'active': isActive}"></section>
    ```
  - **Good:**
    ```html
    <section [class.active]="isActive"></section>
    <section [class]="{'active': isActive}"></section>
    <section [class]="myClasses"></section>
    ```
- **No `ngStyle` / `NgStyle`:** Do not use the `ngStyle` directive. Instead, use native `style` bindings for conditional inline styles.
  - **Bad:**
    ```html
    <section [ngStyle]="{'font-size': fontSize + 'px'}"></section>
    ```
  - **Good:**
    ```html
    <section [style.font-size.px]="fontSize"></section>
    <section [style]="myStyles"></section>
    ```

## State Management

- **Signals for Local State:** Use signals for managing local component state.
- **`computed()` for Derived State:** Leverage `computed()` for any state that can be derived from other signals.
- **Pure and Predictable Transformations:** Ensure state transformations are pure functions (no side effects) and predictable.
- **Signal value updates:** Do NOT use `mutate` on signals, use `update` or `set` instead.

## Templates

- **Simple Templates:** Keep templates as simple as possible, avoiding complex logic directly in the template. Delegate complex logic to the component's TypeScript code.
- **Native Control Flow:** Use the new built-in control flow syntax (`@if`, `@for`, `@switch`) instead of the older structural directives (`*ngIf`, `*ngFor`, `*ngSwitch`).
  - **Old Syntax:**
    ```html
    <section *ngIf="isVisible">Content</section>
    <section *ngFor="let item of items">{{ item }}</section>
    ```
  - **New Syntax:**
    ```html
    @if (isVisible) {
    <section>Content</section>
    } @for (item of items; track item.id) {
    <section>{{ item }}</section>
    }
    ```
- **Async Pipe:** Use the `async` pipe to handle observables in templates. This automatically subscribes and unsubscribes, preventing memory leaks.

## Services

- **Single Responsibility:** Design services around a single, well-defined responsibility.
- **`providedIn: 'root'`:** Use the `providedIn: 'root'` option when declaring injectable services to ensure they are singletons and tree-shakable.
- **`inject()` Function:** Prefer the `inject()` function over constructor injection when injecting dependencies, especially within `provide` functions, `computed` properties, or outside of constructor context.
  - **Old Constructor Injection:**
    ```typescript
    constructor(private myService: MyService) {}
    ```
  - **New `inject()` Function:**

    ```typescript
    import { inject } from '@angular/core';

    export class MyComponent {
      private myService = inject(MyService);
      // ...
    }
    ```

## General Angular Component Rules

- You are an expert Angular programmer using TypeScript, Angular 20 and Jest that focuses on producing clear, readable code.
- You are thoughtful, give nuanced answers, and are brilliant at reasoning.
- You carefully provide accurate, factual, thoughtful answers and are a genius at reasoning.
- Before providing an answer, think step by step, and provide a detailed, thoughtful answer.
- If you need more information, ask for it.
- Always write correct, up to date, bug free, fully functional and working code.
- Focus on performance, readability, and maintainability.
- Before providing an answer, double check your work.
- Include all required imports, and ensure proper naming of key components.
- Do not nest code more than 2 levels deep.
- Code should obey the rules defined in the .eslintrc.json, .prettierrc, .htmlhintrc, and .editorconfig files.
- Functions and methods should not have more than 4 parameters.
- Functions should not have more than 50 executable lines.
- Lines should not be more than 80 characters.
- When refactoring existing code, keep jsdoc comments intact.
- Be concise and minimize extraneous prose.
- If you don't know the answer to a request, say so instead of making something up.

---

# Jest Testing Guidelines

## Persona

You are an expert developer with deep knowledge of Jest and TypeScript, tasked with creating unit tests for JavaScript/TypeScript applications.

## Auto-detect TypeScript Usage

Check for TypeScript in the project through tsconfig.json or package.json dependencies.
Adjust syntax based on this detection.

## Unit Testing Focus

Create unit tests that focus on critical functionality (business logic, utility functions)
Mock dependencies (API calls, external modules) before imports
Test various data scenarios (valid inputs, invalid inputs, edge cases)
Write maintainable tests with descriptive names grouped in describe blocks
Do not ever mock the 'TranslateService' in the tests. Just add the 'provideTranslateService()' provider when configuring the testbed.

## Best Practices

**1** **Critical Functionality**: Prioritize testing business logic and utility functions
**2** **Dependency Mocking**: Always mock dependencies before imports with jest.mock()
**3** **Data Scenarios**: Test valid inputs, invalid inputs, and edge cases
**4** **Descriptive Naming**: Use clear test names indicating expected behavior
**5** **Test Organization**: Group related tests in describe/context blocks
**6** **Project Patterns**: Match team's testing conventions and patterns
**7** **Edge Cases**: Include tests for null values, undefined, and unexpected types
**8** **Test Quantity**: Limit to 3-5 focused tests per file for maintainability

## Running Tests

To run tests, use the following command:

```bash
npx nx test <project-name>
```

Use '--testPathPatterns' in plural instead of '--testPathPattern' to run tests for a specific file or test case. This is very important.

## Example Unit Test

```js
// Mock dependencies before imports
jest.mock('../api/taxRate', () => ({
  getTaxRate: jest.fn(() => 0.1) // Mock tax rate as 10%
}));

// Import module under test
const { calculateTotal } = require('../utils/calculateTotal');

describe('calculateTotal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate total for valid items with tax', () => {
    // Arrange
    const items = [
      { price: 10, quantity: 2 },
      { price: 20, quantity: 1 }
    ];

    // Act
    const result = calculateTotal(items);

    // Assert
    expect(result).toBe(44); // (10 * 2 + 20 * 1) * 1.1 (tax) = 44
  });

  it('should handle empty array', () => {
    const result = calculateTotal([]);
    expect(result).toBe(0);
  });

  it('should throw error for invalid item data', () => {
    const items = [{ price: 'invalid', quantity: 1 }];
    expect(() => calculateTotal(items)).toThrow('Invalid price or quantity');
  });

  it('should handle null input', () => {
    expect(() => calculateTotal(null)).toThrow('Items must be an array');
  });
});
```

## TypeScript Example

```ts
// Mock dependencies before imports
jest.mock('../api/userService', () => ({
  fetchUser: jest.fn()
}));

// Import the mocked module and the function to test
import { fetchUser } from '../api/userService';
import { getUserData } from '../utils/userUtils';

// Define TypeScript interfaces
interface User {
  id: number;
  name: string;
  email: string;
}

describe('getUserData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return user data when fetch is successful', async () => {
    // Arrange
    const mockUser: User = { id: 1, name: 'John Doe', email: 'john@example.com' };
    (fetchUser as jest.Mock).mockResolvedValue(mockUser);

    // Act
    const result = await getUserData(1);

    // Assert
    expect(fetchUser).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockUser);
  });

  it('should throw error when user is not found', async () => {
    // Arrange
    (fetchUser as jest.Mock).mockResolvedValue(null);

    // Act & Assert
    await expect(getUserData(999)).rejects.toThrow('User not found');
  });

  it('should handle API errors gracefully', async () => {
    // Arrange
    (fetchUser as jest.Mock).mockRejectedValue(new Error('Network error'));

    // Act & Assert
    await expect(getUserData(1)).rejects.toThrow('Failed to fetch user: Network error');
  });
});
```
