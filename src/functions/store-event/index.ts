import { KinesisStreamHandler } from "aws-lambda";

import { readEnv } from "../../app-helper";
import KinesisRepository from "../../repositories/kinesis-repository";

import logger from "../../logger";

export const handler: KinesisStreamHandler = async (event, _context, callback) => {
  const repository = new KinesisRepository(readEnv("NUCLEUS_EVENT_STORAGE_STREAM_NAME"));
  const result = await repository.storeBatch(event.Records.map((r) => r.kinesis.data));
  if (result.FailedRecordCount > 0) {
    logger.error(
      result.Records.filter((r) => !!r.ErrorCode),
      "Some events could not be fanned out.",
    );
    callback(new Error("Some events could not be fanned out to the delivery stream."));
  }
};
