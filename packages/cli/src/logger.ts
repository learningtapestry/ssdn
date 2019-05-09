/**
 * logger.ts: Main file-based application logger
 */

import Pino from "pino";

const logger = Pino(
  {
    prettyPrint: { colorize: false, translateTime: true },
  },
  Pino.destination("./nucleus.log"),
);

export default logger;
