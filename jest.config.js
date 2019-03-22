const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.test") });

module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testEnvironmentOptions: { resources: "usable" },
  testPathIgnorePatterns: ["/node_modules/", "/integration-test/"],
  coverageDirectory: "coverage",
  setupFiles: ["<rootDir>/src/testSetup.ts"],
};
