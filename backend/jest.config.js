export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 30000, // Increased timeout for in-memory DB setup
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  globalSetup: './tests/setup.js',
  globalTeardown: './tests/teardown.js',
};