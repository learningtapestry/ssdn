import { KinesisStreamHandler } from "aws-lambda";
import chunk from "lodash/fp/chunk";

import Event from "../../interfaces/event";
import logger from "../../logger";
import { getEventRouter } from "../../services";
import { parseKinesisData } from "../api-helper";

// Cache router lookups by defining the router in the outer scope.
const router = getEventRouter();

export const handler: KinesisStreamHandler = async (event) => {
  for (const records of chunk(100)(event.Records)) {
    try {
      await router.route(records.map((record) => parseKinesisData<Event>(record.kinesis.data)));
    } catch (error) {
      logger.error(error);
    }
  }
};
