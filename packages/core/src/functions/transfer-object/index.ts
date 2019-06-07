import { KinesisStreamHandler } from "aws-lambda";

import Event from "../../interfaces/event";
import { getConnectionRepository, getS3TransferService } from "../../services";
import { parseKinesisData } from "../api-helper";

const connectionRepository = getConnectionRepository();
const s3TransferService = getS3TransferService();

export const handler: KinesisStreamHandler = async (event) => {
  for (const record of event.Records) {
    const nucleusEvent = parseKinesisData<Event>(record.kinesis.data);
    if (!nucleusEvent.source || nucleusEvent.event.protocol !== "S3") {
      continue;
    }
    const connection = await connectionRepository.get(nucleusEvent.source.endpoint);
    await s3TransferService.transferObject(connection, nucleusEvent);
  }
};
