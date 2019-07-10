import { KinesisStreamHandler } from "aws-lambda";

import Event from "../../interfaces/event";
import logger from "../../logger";
import { getConnectionRepository, getS3TransferService } from "../../services";
import { parseKinesisData } from "../api-helper";

const connectionRepository = getConnectionRepository();
const s3TransferService = getS3TransferService();

export const handler: KinesisStreamHandler = async (event) => {
  for (const record of event.Records) {
    const ssdnEvent = parseKinesisData<Event>(record.kinesis.data);
    if (!ssdnEvent.source || ssdnEvent.event.protocol !== "S3") {
      logger.info(`Skipping event [source: null | protocol: ${ssdnEvent.event.protocol}]`);
      continue;
    }
    try {
      const connection = await connectionRepository.get(ssdnEvent.source.endpoint);
      await s3TransferService.transferObject(connection, ssdnEvent);
      logger.info(
        // tslint:disable-next-line:max-line-length
        `Processed event [source: ${ssdnEvent.source.endpoint} | protocol: ${ssdnEvent.event.protocol}]`,
      );
    } catch (error) {
      logger.error(error);
    }
  }
};
