const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  passWithNoTests: true,
  coverageReporters: ['text', 'text-summary'],
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{ts,js,jsx}',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  testTimeout: 60000,
  testPathIgnorePatterns: [
    '/node_modules/',
    'index.ts',
    'jest.config.ts',
    'eslint.config.js',
    'main.ts',
    'app.config.ts',
    'app.routes.ts'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    'index.ts',
    'jest.config.ts',
    'eslint.config.js',
    'main.ts',
    'app.config.ts',
    'app.routes.ts'
  ]
};
