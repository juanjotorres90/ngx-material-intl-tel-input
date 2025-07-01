import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

// Global mock for IMask to resolve dependency issues
jest.mock('imask', () => {
  const mockIMask = jest.fn(() => ({
    destroy: jest.fn(),
    updateOptions: jest.fn(),
    value: '',
    unmaskedValue: '',
    resolve: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    updateValue: jest.fn(),
    typedValue: '',
    element: null
  }));

  return {
    __esModule: true,
    default: mockIMask
  };
});
