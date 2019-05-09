/**
 * app-helper.ts: General module containing utility functions
 */

import logger from "./logger";

export async function execute(command: () => void) {
  try {
    await command();
  } catch (error) {
    logger.error(error.stderr);
    printError(
      "An unexpected error has occurred. Please check the 'nucleus.log' file for more details.",
    );
    process.exit(1);
  }
}

export function printBright(text: string) {
  console.log("\x1b[1m%s\x1b[0m", text);
}

export function printSuccess(text: string) {
  console.log("\x1b[1m\x1b[32m%s\x1b[0m", text);
}

export function printError(text: string) {
  console.log("\x1b[1m\x1b[31m%s\x1b[0m", text);
}
