const fs = require("fs");
const path = require("path");
const currentEnv = process.env.NUCLEUS_ENV || "test";
const pathToEnvFile = path.resolve(process.cwd(), `.env.${currentEnv}`);
if (fs.existsSync(pathToEnvFile)) {
  require("dotenv").config({ path: pathToEnvFile });
}

module.exports = {
  coverageDirectory: "coverage",
  testEnvironment: "node",
};
