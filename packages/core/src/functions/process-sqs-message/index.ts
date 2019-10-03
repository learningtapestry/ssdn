import { SQSHandler } from "aws-lambda";

import logger from "../../logger";
import SQSEventParser from "../../parsers/sqs-event-parser";
import { getEventRepository } from "../../services";
import SQSMessageService from "../../services/sqs-message-service";

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    try {
      await SQSMessageService.process(
        new SQSEventParser(record, process.env.SSDN_NAMESPACE!).parse(),
        getEventRepository(),
      );
    } catch (error) {
      logger.error(error);
    }
  }
};
