import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

// For CI, you may want to set BASE_URL to the deployed application.
const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import 'dotenv/config';

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * Generated as a .mts file so Node forces ESM regardless of workspace
 * `type`. Playwright routes `.mts` through its ESM loader (dynamic import,
 * bypassing the pirates CJS-compile path), and Nx's native TS strip loads
 * `.mts` directly. Playwright's configLoader auto-discovers
 * `playwright.config.mts` via its extension list
 * (.ts/.js/.mts/.mjs/.cts/.cjs).
 */
export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry'
  },
  /* Run your local dev server before starting the tests */
  webServer: {
    // ponytail: dev server for local and CI alike; swap in a serve-static
    // target off a production build if CI wall-clock becomes a problem
    command: 'npx nx run ngx-material-intl-tel-input:serve',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    // the Angular dev server cold-starts in ~30s
    timeout: 120_000,
    cwd: workspaceRoot
  },
  // ponytail: chromium only — the behavior under test (caret handling, IMask,
  // Material layout) is not engine-specific. Add firefox/webkit if a
  // browser-specific bug is ever reported.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
