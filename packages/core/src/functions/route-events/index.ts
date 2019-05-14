import { KinesisStreamHandler } from "aws-lambda";
import chunk from "lodash/fp/chunk";

import { getEventRouter } from "../../aws-services";
import Event from "../../interfaces/event";

const router = getEventRouter();

export const handler: KinesisStreamHandler = async (event) => {
  for (const records of chunk(100)(event.Records)) {
    await router.route(records.map((record) => parseKinesisData<Event>(record.kinesis.data)));
  }
};

function parseKinesisData<T>(data: string) {
  // Kinesis data is stored as a Base64 encoded string.
  // The Base64 decoded value must then parsed as a JSON.
  const decodedData = new Buffer(data, "base64").toString("ascii");
  return JSON.parse(decodedData) as T;
}
