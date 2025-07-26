const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"], // if you have a setup file
  testEnvironment: "jest-environment-jsdom",
  preset: "ts-jest",
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you soon)
    "^@/components/(.*)$": "<rootDir>/src/components/$1",
    "^@/pages/(.*)$": "<rootDir>/src/pages/$1",
    "^@/app/(.*)$": "<rootDir>/src/app/$1",
    "^@/lib/(.*)$": "<rootDir>/src/lib/$1",
    "^@/styles/(.*)$": "<rootDir>/src/styles/$1",
    "^@/services/(.*)$": "<rootDir>/src/services/$1",
    "^@/types/(.*)$": "<rootDir>/src/types/$1",
    "^@/context/(.*)$": "<rootDir>/src/context/$1",
    "^@/supabaseClient$": "<rootDir>/src/supabaseClient",
    "^@/(.*)$": "<rootDir>/src/$1",
    // Handle CSS imports (if you use them)
    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
  },
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        babelConfig: true, // This will look for babel.config.js if you have one for other transforms
      },
    ],
  },
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.next/",
    "<rootDir>/tests/playwright/",
    "<rootDir>/tests/e2e/",
  ],
  // Next.js automatically sets transformIgnorePatterns for you.
  // If you have specific node_modules that need transforming, you can add them like so:
  // transformIgnorePatterns: [
  //   '/node_modules/(?!your-module-that-needs-transforming)/',
  // ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
