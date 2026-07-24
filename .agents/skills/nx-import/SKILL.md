---
name: nx-import
description: Import, merge, or combine repositories into this npm-based Nx workspace with nx import. USE WHEN the user asks to adopt Nx across repositories, move projects into a monorepo, or preserve history while bringing in another project.
---

# Import projects into this Nx workspace

This repository uses npm. Use `npx nx` for Nx commands and `npm install` for
dependency installation.

## Before importing

1. Read current Nx documentation for `nx import`.
2. Inspect the source repository's project layout, package manifests, build
   tools, and Git state.
3. Inspect the destination workspace conventions and existing project names.
4. Choose a destination directory that does not already exist.
5. Decide whether commit history must be preserved.

Primary documentation:

- https://nx.dev/docs/guides/adopting-nx/import-project
- https://nx.dev/docs/guides/adopting-nx/preserving-git-histories

Run `npx nx import --help` before constructing unfamiliar flags.

## Import strategy

Prefer importing one application or library at a time when the source is
already a monorepo:

```bash
npx nx import <source> apps/my-app --source=apps/my-app
npx nx import <source> libs/my-lib --source=libs/my-lib
```

Use a whole-repository import only for a single-project source. Whole-repo
imports bring root configuration into a nested directory and require more
cleanup.

Follow the destination's existing directory conventions. Applications belong
under `apps/`; libraries belong under the workspace's library convention.

## Required reconciliation

`nx import` does not fully merge root configuration. Compare and reconcile:

- `dependencies` and `devDependencies` in `package.json`;
- npm `workspaces` entries;
- `targetDefaults`, `namedInputs`, and plugins in `nx.json`;
- TypeScript base configuration and project references;
- root ESLint and formatter configuration;
- CI paths and affected commands; and
- explicit executor paths such as `main`, `outputPath`, `tsConfig`, `assets`,
  and `sourceRoot`.

Install missing dependencies from the workspace root:

```bash
npm install
```

Add Nx plugins with:

```bash
npx nx add @nx/<plugin>
```

## Cleanup

For whole-repository imports, remove stale nested files only after confirming
that imported projects do not extend or reference them:

- `node_modules/`;
- `package-lock.json`;
- nested `.gitignore`;
- nested `nx.json`; and
- redundant root documentation.

Do not blindly delete a nested `tsconfig.base.json`; imported projects may
still extend it.

## Common failures

### Project name collisions

Every Nx project and package name must be unique. Rename conflicts, update
imports and dependency declarations, then run `npm install`.

### Missing workspace dependency

Import all required local packages, ensure they are included in the root
`workspaces` configuration, and link them with npm workspace commands. Do not
mask missing links with TypeScript path aliases.

### TypeScript references

After import:

```bash
npx nx reset
npx nx sync --yes
```

If a source uses `noEmit: true`, reconcile it with Nx project references.
Libraries that participate in references commonly need `composite`,
declaration output, an `outDir`, and a `tsBuildInfoFile`.

### Missing root ESLint configuration

Install the required ESLint packages with npm, restore the root flat config,
and add the appropriate Nx plugin. Match the versions already used by the
destination workspace.

### Broken imported scripts

Review imported `package.json` scripts after Nx initialization. Prefer Nx
targets over duplicated scripts, and remove scripts that recursively invoke
their own Nx target.

## Validation

Start with project discovery:

```bash
npx nx show projects
```

Then run the affected checks:

```bash
npx nx affected -t lint test build
```

Confirm the final project graph, package links, build outputs, and Git history
before handoff.

For Gradle or Turborepo sources, use the matching file in `references/`.
