const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.test") });

module.exports = {
  coverageDirectory: "coverage",
  globalSetup: "<rootDir>/src/setup.ts",
  preset: "ts-jest",
  testEnvironment: "node",
};
