/**
 * file-upload-service.ts: Receives a file transfer SSDN event representation and puts it into
 * the repository.
 */

import Event from "../interfaces/event";
import logger from "../logger";
import { EventRepository } from "../repositories/event-repository";

export default class FileUploadService {
  public static async process(event: Event, repository: EventRepository) {
    try {
      logger.debug("Processing event: %j", event);

      const record = await repository.store(event);

      logger.info("Event has been processed, returning Kinesis record: %j", record);

      return record;
    } catch (error) {
      logger.error("Unexpected error while processing: %j", error.stack);

      return {
        error: error.message,
      };
    }
  }
}
