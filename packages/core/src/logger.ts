/**
 * logger.ts: Main application logger, tailored to different environments
 */

import Pino from "pino";

const logger = Pino({
  level: process.env.NUCLEUS_LOG_LEVEL || "info",
  prettyPrint: { colorize: true, translateTime: true },
});

export default logger;
