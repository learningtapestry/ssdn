const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.test") });

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  coverageDirectory: "coverage",
};
