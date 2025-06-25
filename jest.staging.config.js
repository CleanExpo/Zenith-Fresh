const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  displayName: 'Staging Tests',
  testMatch: ['<rootDir>/tests/staging/**/*.test.{js,ts}'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.staging.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30000, // Longer timeout for staging API calls
};

module.exports = createJestConfig(customJestConfig);