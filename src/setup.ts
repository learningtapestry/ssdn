/**
 * setup.ts: Initialization script that bootstraps the required application components.
 *
 * This script only intended to be used in development/testing. Please DO NOT use this script to
 * create the resources in production. Use the SAM/CloudFormation template instead.
 */

import Kinesis from "aws-sdk/clients/kinesis";
import {config} from "dotenv";

config();

createKinesisStream(kinesisStreamName());

async function createKinesisStream(name: string) {
    print(`Creating Kinesis Data Stream '${name}' `);
    const kinesis = new Kinesis({apiVersion: "2013-12-02", endpoint: kinesisEndpoint()});
    try {
        await kinesis.describeStream({StreamName: name}).promise();
        print("[ALREADY EXISTS]\n");
    } catch (error) {
        await kinesis.createStream({ShardCount: 1, StreamName: name}).promise();
        print("[DONE]\n");
    }
}

function kinesisEndpoint() {
    return process.env.NUCLEUS_EVENT_PROCESSOR_STREAM_ENDPOINT || "http://localhost:4568";
}

function kinesisStreamName() {
    return process.env.NUCLEUS_EVENT_PROCESSOR_STREAM_NAME || "Nucleus-EventProcessor";
}

function print(text: string) {
    process.stdout.write(text);
}
