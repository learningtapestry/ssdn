/**
 * setup.ts: Initialization script that bootstraps the required application components.
 *
 * This script is only intended to be used in development/testing. Please DO NOT use this script to
 * create the resources in production. Use the SAM/CloudFormation template instead.
 */
import DynamoDB from "aws-sdk/clients/dynamodb";
import { config as dotenvConfig } from "dotenv";

import { getCloudFormationClient, getKinesis } from "./aws-clients";
import { readEnv } from "./helpers/app-helper";
import { STREAMS, TABLES } from "./services/aws-entity-names";

// If invoked as a script, immediately run setup().
if (require.main === module) {
  dotenvConfig();
  setup();
}

/**
 * Sets up a development/testing environment with localstack.
 * This function is exported as the default, making it compatible with Jest's globalSetup.
 */
export default async function setup() {
  print("\nSetting up test resources.\n");
  // await createStack("Test");
  await createKinesisStream(STREAMS.eventProcessor);
  // await createDynamoTable(
  //   TABLES.nucleusConnections,
  //   [{ AttributeName: "endpoint", AttributeType: "S" }],
  //   [{ AttributeName: "endpoint", KeyType: "HASH" }],
  // );
  // await createDynamoTable(
  //   TABLES.nucleusConnectionRequests,
  //   [{ AttributeName: "id", AttributeType: "S" }],
  //   [{ AttributeName: "id", KeyType: "HASH" }],
  // );
  // await createDynamoTable(
  //   TABLES.nucleusIncomingConnectionRequests,
  //   [
  //     { AttributeName: "endpoint", AttributeType: "S" },
  //     { AttributeName: "id", AttributeType: "S" },
  //   ],
  //   [{ AttributeName: "endpoint", KeyType: "HASH" }, { AttributeName: "id", KeyType: "RANGE" }],
  // );
}

async function createKinesisStream(name: string) {
  print(`Creating Kinesis Data Stream '${name}' `);
  try {
    await getKinesis({
      endpoint: readEnv("NUCLEUS_KINESIS_ENDPOINT"),
    })
      .createStream({ ShardCount: 1, StreamName: name })
      .promise();
  } catch (e) {
    print(` -> ${e.name} [ALREADY EXISTS?]\n`);
  }
}

async function createDynamoTable(
  name: string,
  attributeDefs: DynamoDB.AttributeDefinition[],
  keySchema: DynamoDB.KeySchemaElement[],
) {
  print(`Creating table '${name}' `);
  const dynamo = new DynamoDB({
    endpoint: readEnv("NUCLEUS_KINESIS_ENDPOINT"),
  });
  try {
    await dynamo
      .createTable({
        AttributeDefinitions: attributeDefs,
        KeySchema: keySchema,
        ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
        TableName: name,
      })
      .promise();
  } catch (e) {
    print(` -> ${e.name} [ALREADY EXISTS?]\n`);
  }
}

async function createStack(name: string) {
  print(`Creating stack '${name}'`);
  try {
    await getCloudFormationClient({ endpoint: readEnv("NUCLEUS_CLOUDFORMATION_ENDPOINT") })
      .createStack({
        StackName: name,
        TemplateBody: JSON.stringify({
          AWSTemplateFormatVersion: "2010-09-09",
          Description: "Test",
          Resources: {},
        }),
      })
      .promise();
  } catch (e) {
    print(` -> ${e.name} [ALREADY EXISTS?]\n`);
  }
}

function print(text: string) {
  process.stdout.write(text);
}
