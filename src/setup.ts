/**
 * setup.ts: Initialization script that bootstraps the required application components.
 *
 * This script is only intended to be used in development/testing. Please DO NOT use this script to
 * create the resources in production. Use the SAM/CloudFormation template instead.
 */

import Kinesis from "aws-sdk/clients/kinesis";
import { config } from "dotenv";
import { readEnv } from "./app-helper";

config();

createKinesisStream(readEnv("NUCLEUS_EVENT_PROCESSOR_STREAM_NAME"));

async function createKinesisStream(name: string) {
    print(`Creating Kinesis Data Stream '${name}' `);
    const kinesis = new Kinesis({
        apiVersion: "2013-12-02",
        endpoint: readEnv("NUCLEUS_EVENT_PROCESSOR_STREAM_ENDPOINT", ""),
    });
    try {
        await kinesis.describeStream({ StreamName: name }).promise();
        print("[ALREADY EXISTS]\n");
    } catch (error) {
        await kinesis
            .createStream({ ShardCount: 1, StreamName: name })
            .promise();
        print("[DONE]\n");
    }
}

function print(text: string) {
    process.stdout.write(text);
}
