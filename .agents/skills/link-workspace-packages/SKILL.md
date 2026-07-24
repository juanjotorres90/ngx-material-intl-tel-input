---
name: link-workspace-packages
description: 'Link npm workspace packages in monorepos. USE WHEN: (1) newly created packages need dependencies wired up, (2) code imports from a sibling package, or (3) workspace package resolution fails with errors such as "cannot find module", "failed to resolve import", or "TS2307". Do not patch around the problem with tsconfig paths or manual package.json edits; use npm workspace commands.'
---

# Link npm workspace packages

This repository uses npm. The root `package-lock.json` is authoritative.

## Workflow

1. Identify the consumer package that contains the import.
2. Identify the provider package being imported.
3. Confirm both packages are included by the root `workspaces` configuration.
4. Add the dependency to the consumer with npm.
5. Verify the consumer's manifest and workspace link.

Add one dependency:

```bash
npm install @org/ui --workspace @org/app
```

Add several dependencies:

```bash
npm install @org/data-access @org/ui --workspace @org/app
```

npm records local workspace packages in the consumer's `package.json` and
links them during installation.

## Debug resolution failures

1. Confirm the provider's `package.json` has the expected `name`.
2. Confirm the consumer declares that package in `dependencies` or
   `devDependencies`.
3. Confirm the root `package.json` includes both workspace paths.
4. Run `npm install` from the workspace root.
5. Verify `<consumer>/node_modules/@org/<package>` resolves to the workspace
   package.
6. Run the smallest relevant Nx build, test, or typecheck target.

Keep the root package private to prevent accidental publication.
