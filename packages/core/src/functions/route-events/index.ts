import { KinesisStreamHandler } from "aws-lambda";
import chunk from "lodash/fp/chunk";

import { decode64 } from "../../helpers/app-helper";
import Event from "../../interfaces/event";
import { getEventRouter } from "../../services";

// Cache router lookups by defining the router in the outer scope.
const router = getEventRouter();

export const handler: KinesisStreamHandler = async (event) => {
  for (const records of chunk(100)(event.Records)) {
    await router.route(records.map((record) => parseKinesisData<Event>(record.kinesis.data)));
  }
};

function parseKinesisData<T>(data: string) {
  // Kinesis data is stored as a Base64 encoded string.
  // The Base64 decoded value must then parsed as a JSON.
  const decodedData = decode64(data);
  return JSON.parse(decodedData) as T;
}
