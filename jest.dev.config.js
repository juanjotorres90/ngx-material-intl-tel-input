const preset = require('./jest.preset.js');

module.exports = {
  ...preset,
  collectCoverage: false,
  coverageReporters: undefined // Remove coverage reporters to speed up
};
