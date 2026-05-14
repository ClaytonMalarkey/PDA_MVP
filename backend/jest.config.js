module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/server.js'
  ],
  testTimeout: 30000,
  // Property-based testing configuration
  globals: {
    'fast-check': {
      numRuns: 100
    }
  }
};
