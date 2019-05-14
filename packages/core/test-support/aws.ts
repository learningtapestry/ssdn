/**
 * aws.ts: Support functions related to AWS resources
 */
import Kinesis from "aws-sdk/clients/kinesis";
import Lambda from "aws-sdk/clients/lambda";

export async function invokeLambda(functionArn: string, payload: object) {
  const client = new Lambda({ apiVersion: "2015-03-31" });
  const params = {
    FunctionName: functionArn,
    Payload: JSON.stringify(payload),
  };

  return await client.invoke(params).promise();
}

export async function getStreamRecords(streamName: string, timestamp: Date = new Date()) {
  const client = new Kinesis({ apiVersion: "2013-12-02" });
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
