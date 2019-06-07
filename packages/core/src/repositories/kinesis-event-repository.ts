/**
 * kinesis-event-repository.ts: Repository class to manage Kinesis Data Streams access
 */

import Kinesis, { PutRecordsInput } from "aws-sdk/clients/kinesis";
import { STREAMS } from "../interfaces/aws-metadata-keys";
import logger from "../logger";
import NucleusMetadataService from "../services/nucleus-metadata-service";
import { Content, EventRepository } from "./event-repository";

export default class KinesisEventRepository implements EventRepository {
  public client: Kinesis;

  public metadata: NucleusMetadataService;

  constructor(metadata: NucleusMetadataService, client: Kinesis) {
    this.metadata = metadata;
    this.client = client;
  }

  public async store(content: Content, { partitionKey = "DEFAULT" } = {}) {
    logger.debug("Storing content: %j using partition key: %s", content, partitionKey);
    const record = {
      Data: JSON.stringify(content),
      PartitionKey: partitionKey,
      StreamName: await this.getStreamName(),
    };

    return await this.client.putRecord(record).promise();
  }

  public async storeBatch(content: Content[] = [], { partitionKey = "DEFAULT" } = {}) {
    logger.debug(
      "Storing content (batch): %i records using partition key: %s",
      content.length,
      partitionKey,
    );

    // The maximum chunksize for `PutRecords` is 500.
    // See https://docs.aws.amazon.com/kinesis/latest/APIReference/API_PutRecords.html
    if (content.length > 500) {
      throw new Error("This method should not be called with more than 500 entries.");
    }

    const batchInput: PutRecordsInput = {
      Records: content.map((item) => ({
        Data: typeof item === "string" ? item : JSON.stringify(item),
        PartitionKey: partitionKey,
      })),
      StreamName: await this.getStreamName(),
    };

    return await this.client.putRecords(batchInput).promise();
  }

  private async getStreamName() {
    const name = await this.metadata.getMetadataValue(STREAMS.eventProcessor);
    return name.value;
  }
}
