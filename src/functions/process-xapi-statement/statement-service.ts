/**
 * event-service.ts: Receives a collected event, parses it to convert it to an internal Nucleus
 * event representation, then puts it into the repository.
 */

import get from "lodash/fp/get";
import logger from "../../logger";

export default class StatementService {
    public static async process(event: object, validator: Validator, repository: Repository) {
        try {
            logger.debug("Processing event: %j", event);
            if (validator.validate({statement: get("content")(event)})) {
                const record = await repository.store(event);

                logger.info("Event has been processed, returning Kinesis record: %j", record);

                return [get("content.id")(event)];
            } else {
                logger.debug("Failed event validation with errors: %j", validator.errors());

                return {errors: validator.errors(), message: "The provided document is not valid"};
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
