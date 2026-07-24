/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.jest.json" }],
  },
  setupFiles: ["<rootDir>/test/env.ts"],
  globalSetup: "<rootDir>/test/globalSetup.ts",
  testMatch: ["**/*.test.ts"],
  collectCoverageFrom: ["src/controllers/**/*.ts", "src/utils/**/*.ts"],
  testTimeout: 20000,
};
