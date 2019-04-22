/**
 * aws.ts: Support functions related to AWS resources
 */

import ApiGateway from "aws-sdk/clients/apigateway";
import CloudFormation from "aws-sdk/clients/cloudformation";
import Kinesis from "aws-sdk/clients/kinesis";
import Lambda from "aws-sdk/clients/lambda";
import find from "lodash/fp/find";
import get from "lodash/fp/get";
import { readEnv } from "../src/app-helper";

export function currentStack(): string {
  return readEnv("NUCLEUS_TESTING_STACK_NAME", "Nucleus-Test");
}

export async function getOutputValue(key: string, stackName: string) {
  const cloudFormation = new CloudFormation({ apiVersion: "2010-05-15" });
  const stackData = await cloudFormation.describeStacks({ StackName: stackName }).promise();

  if (stackData.Stacks) {
    return get("OutputValue")(find({ OutputKey: key })(stackData.Stacks[0].Outputs));
  }
}

export async function getApiKey(keyId: string) {
  const apiGateway = new ApiGateway({ apiVersion: "2015-07-09" });
  const key = await apiGateway.getApiKey({ apiKey: keyId, includeValue: true }).promise();

  return key.value;
}

export async function invokeLambda(functionArn: string, payload: object) {
  const client = new Lambda({ apiVersion: "2015-03-31" });
  const params = {
    FunctionName: functionArn,
    Payload: JSON.stringify(payload),
  };

  return await client.invoke(params).promise();
}

export async function getStreamRecords(timestamp: Date = new Date()) {
  const client = new Kinesis({ apiVersion: "2013-12-02" });
  const streamName = await getOutputValue("EventProcessorStreamName", currentStack());
  const shards = await client.listShards({ StreamName: streamName }).promise();
  const shardIterator = await client
    .getShardIterator({
      ShardId: shards.Shards ? shards.Shards[0].ShardId : "shardId-000000000000",
      ShardIteratorType: "AT_TIMESTAMP",
      StreamName: streamName,
      Timestamp: timestamp,
    })
    .promise();

  return await client
    .getRecords({ ShardIterator: shardIterator.ShardIterator as string })
    .promise();
}
