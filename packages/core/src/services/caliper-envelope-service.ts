/**
 * caliper-envelope-service.ts: Receives an Caliper-based SSDN envelope, validates it and then puts
 * it into the repository.
 */

import get from "lodash/fp/get";

import Event from "../interfaces/event";
import logger from "../logger";
import { EventRepository } from "../repositories/event-repository";

export default class CaliperEnvelopeService {
  public static async process(event: Event, validator: Validator, repository: EventRepository) {
    try {
      logger.debug("Processing event: %j", event);

      if (validator.validate(get("content")(event), "")) {
        const record = await repository.store(event);

        logger.info("Event has been processed, returning Kinesis record: %j", record);
      } else {
        logger.debug("Failed event validation with errors: %j", validator.errors());

        return {
          errors: validator.errors(),
          message: "The provided document is not valid",
        };
      }
    } catch (error) {
      logger.error("Unexpected error while processing: %j", error.stack);

      return {
        errors: [error.message],
        message: "There was an unexpected error while processing the event",
      };
    }
  }
}
