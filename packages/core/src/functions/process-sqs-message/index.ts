import { SQSHandler } from "aws-lambda";

import logger from "../../logger";
import SQSEventParser from "../../parsers/sqs-event-parser";
import { getEventRepository, getSQSMessageService } from "../../services";

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    try {
      await getSQSMessageService().process(
        new SQSEventParser(record, process.env.SSDN_NAMESPACE!).parse(),
        getEventRepository(),
      );
    } catch (error) {
      logger.error(error);
    }
  }
};
