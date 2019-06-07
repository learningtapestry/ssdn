/**
 * xapi-statement-service.ts: Receives an xAPI-based Nucleus event representation, validates it and
 * then puts it into the repository.
 */

import get from "lodash/fp/get";
import map from "lodash/fp/map";

import { toArray } from "../helpers/app-helper";
import Event from "../interfaces/event";
import logger from "../logger";
import { EventRepository } from "../repositories/event-repository";

export default class XAPIStatementService {
  public static async process(event: Event, validator: Validator, repository: EventRepository) {
    try {
      logger.debug("Processing event: %j", event);

      const content = toArray(get("content")(event));
      if (validator.validate(content, "statement")) {
        const record = await repository.store(event);

        logger.info("Event has been processed, returning Kinesis record: %j", record);

        return map("id")(content);
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
