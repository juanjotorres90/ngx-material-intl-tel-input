const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  passWithNoTests: true,
  coverageReporters: ['html', 'lcov', 'text-summary'],
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{ts,js,jsx}',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  testTimeout: 60000
};
