/**
 * sqs-message-service.ts: Receives a message from an SQS queue to be stored into the repository.
 */

import Event from "../interfaces/event";
import logger from "../logger";
import { EventRepository } from "../repositories/event-repository";

export default class SQSMessageService {
  public static async process(event: Event, repository: EventRepository) {
    try {
      logger.debug("Processing event: %j", event);

      const record = await repository.store(event);

      logger.info("Event has been processed, returning Kinesis record: %j", record);
    } catch (error) {
      logger.error("Unexpected error while processing: %j", error.stack);

      return {
        errors: [error.message],
        message: "There was an unexpected error while processing the event",
      };
    }
  }
}
