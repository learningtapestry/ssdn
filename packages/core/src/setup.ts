/**
 * setup.ts: Initialization script that bootstraps the required application components.
 *
 * This script is only intended to be used in development/testing. Please DO NOT use this script to
 * create the resources in production. Use the SAM/CloudFormation template instead.
 */
import Firehose from "aws-sdk/clients/firehose";
import Kinesis from "aws-sdk/clients/kinesis";
import S3 from "aws-sdk/clients/s3";
import { config as dotenvConfig } from "dotenv";

import { readEnv } from "./helpers/app-helper";

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
  // At the moment there is a bug in localstack that prevents us from setting up the AWS resources
  // for the Firehose component in a realistic way.
  // Firehose needs an "AssumeRole" policy with access to S3 when it is configured to use an S3
  // backend.
  // However, localstack's `AttachRolePolicy` implementation is not working with local user-created
  // policies.
  // Since localstack's Firehose implementation doesn't validate the policy specified in the create
  // request, let's skip the IAM stuff and use a fake one.
  await createS3Bucket("delivery-s3-bucket");
  await createKinesisStream(readEnv("NUCLEUS_EVENT_PROCESSOR_STREAM_NAME"));
  const delStream = await createKinesisStream(readEnv("NUCLEUS_EVENT_STORAGE_STREAM_NAME"));
  await createFirehoseStreamS3Bucket(
    readEnv("NUCLEUS_EVENT_DELIVERY_STREAM_NAME"),
    "arn:aws:s3:::delivery-s3-bucket",
    delStream.StreamARN,
    "arn:aws:iam::000000000000:policy/NucleusS3FullAccess",
  );
}

async function createS3Bucket(name: string) {
  print(`Creating S3 Bucket '${name}' `);
  const s3 = new S3({
    apiVersion: "2006-03-01",
    endpoint: readEnv("NUCLEUS_S3_ENDPOINT"),
  });
  try {
    await s3.headBucket({ Bucket: name }).promise();
    print("[ALREADY EXISTS]\n");
  } catch (error) {
    const bucket = await s3.createBucket({ Bucket: name }).promise();
    print("[DONE]\n");
  }
}

async function createKinesisStream(name: string) {
  print(`Creating Kinesis Data Stream '${name}' `);
  const kinesis = new Kinesis({
    apiVersion: "2013-12-02",
    endpoint: readEnv("NUCLEUS_KINESIS_ENDPOINT"),
  });
  try {
    const stream = await kinesis.describeStream({ StreamName: name }).promise();
    print("[ALREADY EXISTS]\n");
    return stream.StreamDescription;
  } catch (error) {
    await kinesis.createStream({ ShardCount: 1, StreamName: name }).promise();
    const stream = await kinesis.describeStream({ StreamName: name }).promise();
    print("[DONE]\n");
    return stream.StreamDescription;
  }
}

async function createFirehoseStreamS3Bucket(
  name: string,
  s3BucketArn: string,
  kinesisStreamArn: string,
  roleArn: string,
) {
  print(`Creating Firehose Data Stream '${name}' `);
  const firehose = new Firehose({
    apiVersion: "2015-08-04",
    endpoint: readEnv("NUCLEUS_FIREHOSE_ENDPOINT"),
  });
  try {
    await firehose.describeDeliveryStream({ DeliveryStreamName: name }).promise();
    print("[ALREADY EXISTS]\n");
  } catch (error) {
    await firehose
      .createDeliveryStream({
        DeliveryStreamName: name,
        DeliveryStreamType: "KinesisStreamAsSource",
        KinesisStreamSourceConfiguration: {
          KinesisStreamARN: kinesisStreamArn,
          RoleARN: roleArn,
        },
        S3DestinationConfiguration: {
          BucketARN: s3BucketArn,
          RoleARN: roleArn,
        },
      })
      .promise();
    print("[DONE]\n");
  }
}

function print(text: string) {
  process.stdout.write(text);
}
