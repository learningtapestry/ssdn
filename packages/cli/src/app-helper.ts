/**
 * app-helper.ts: General module containing utility functions
 */

import CloudFormation from "aws-sdk/clients/cloudformation";
import keyBy from "lodash/fp/keyBy";
import mapValues from "lodash/fp/mapValues";
import logger from "./logger";

export async function execute(command: () => any) {
  try {
    await command();
  } catch (error) {
    logger.error(error);
    printError(
      "An unexpected error has occurred. Please check the 'ssdn.log' file for more details.",
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

export async function getStackValues(stackName: string) {
  const cloudFormation = new CloudFormation({ apiVersion: "2010-05-15" });
  const stackData = await cloudFormation.describeStacks({ StackName: stackName }).promise();

  if (stackData.Stacks) {
    return mapValues("OutputValue")(keyBy("OutputKey")(stackData.Stacks[0].Outputs));
  }
}
