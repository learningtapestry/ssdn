/**
 * kinesis-repository.ts: Repository class to manage Kinesis Data Streams access
 */

import Kinesis, { PutRecordsInput, PutRecordsResultEntry } from "aws-sdk/clients/kinesis";
import chunk from "lodash/fp/chunk";
import omitBy from "lodash/fp/omitBy";
import { isBlank, readEnv } from "../helpers/app-helper";
import logger from "../logger";

export default class KinesisRepository implements Repository {
  private static clientOptions() {
    const options = {
      apiVersion: "2013-12-02",
      endpoint: readEnv("NUCLEUS_KINESIS_ENDPOINT", ""),
    };

    return omitBy(isBlank)(options);
  }

  public client: Kinesis;

  public streamName: string;

  constructor(streamName: string) {
    this.streamName = streamName;
    this.client = new Kinesis(KinesisRepository.clientOptions());
    logger.debug("Kinesis client created using options: %j", KinesisRepository.clientOptions());
  }

  public async store(content: Content, { partitionKey = "NUCLEUS-PARTITION-KEY" } = {}) {
    logger.debug("Storing content: %j using partition key: %s", content, partitionKey);
    const record = {
      Data: JSON.stringify(content),
      PartitionKey: partitionKey,
      StreamName: this.streamName,
    };

    return await this.client.putRecord(record).promise();
  }

  public async storeBatch(
    content: Content[] = [],
    { partitionKey = "NUCLEUS-PARTITION-KEY" } = {},
  ) {
    logger.debug(
      "Storing content (batch): %i records using partition key: %s",
      content.length,
      partitionKey,
    );

    const resultsAgg = {
      FailedRecordCount: 0,
      Records: [] as PutRecordsResultEntry[],
    };

    // The maximum chunksize for `PutRecords` is 500.
    // See https://docs.aws.amazon.com/kinesis/latest/APIReference/API_PutRecords.html
    for (const records of chunk(500, content)) {
      const batchInput: PutRecordsInput = {
        Records: records.map((item) => ({
          Data: typeof item === "string" ? item : JSON.stringify(item),
          PartitionKey: partitionKey,
        })),
        StreamName: this.streamName,
      };

      const result = await this.client.putRecords(batchInput).promise();
      if (result.FailedRecordCount) {
        resultsAgg.FailedRecordCount += result.FailedRecordCount;
      }
      if (result.Records) {
        resultsAgg.Records = resultsAgg.Records.concat(result.Records);
      }
    }

    return resultsAgg;
  }
}
