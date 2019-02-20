/**
 * kinesis-repository.ts: Repository class to manage Kinesis Data Streams access
 */

import Kinesis from "aws-sdk/clients/kinesis";
import get from "lodash/fp/get";
import omitBy from "lodash/fp/omitBy";
import {isBlank} from "../app-helper";
import logger from "../logger";

export default class KinesisRepository implements Repository {
    private static clientOptions() {
        const options = {
            apiVersion: "2013-12-02",
            endpoint: get("NUCLEUS_EVENT_PROCESSOR_STREAM_ENDPOINT")(process.env),
        };

        return omitBy(isBlank)(options);
    }

    public client: Kinesis;

    constructor() {
        this.client = new Kinesis(KinesisRepository.clientOptions());
        logger.debug("Kinesis client created using options: %j", KinesisRepository.clientOptions());
    }

    public async store(content: object, {partitionKey = "NUCLEUS-PARTITION-KEY"} = {}) {
        logger.debug("Storing content: %j using partition key: %s", content, partitionKey);
        const record = {
            Data: JSON.stringify(content),
            PartitionKey: partitionKey,
            StreamName: get("NUCLEUS_EVENT_PROCESSOR_STREAM_NAME")(process.env),
        };

        return await this.client.putRecord(record).promise();
    }
}
