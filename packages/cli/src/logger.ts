/**
 * logger.ts: Main file-based application logger
 */

import Pino from "pino";

const logger = Pino(
  {
    prettyPrint: { colorize: false, translateTime: true },
  },
  Pino.destination("./ssdn.log"),
);

export default logger;
