import { LAMBDAS, STREAMS } from "../src/interfaces/aws-metadata-keys";
import { MetadataValue } from "../src/interfaces/base-types";
import { getMetadataService } from "../src/services";
import { getStreamRecords, invokeLambda } from "../test-support/aws";
import putXAPIStatementEvent from "../test-support/lambda-events/put-xapi-statement-event.json";

const metadata = getMetadataService();

describe("Process xAPI Statement Function", () => {
  let processXAPIStatementFunction: MetadataValue<LAMBDAS>;
  let streamName: MetadataValue<STREAMS>;

  beforeAll(async () => {
    jest.setTimeout(15000);
    processXAPIStatementFunction = await metadata.getMetadataValue(LAMBDAS.processXAPIStatement);
    streamName = await metadata.getMetadataValue(STREAMS.eventProcessor);
  });

  it("stores the event in the stream", async () => {
    const currentTime = new Date();

    const response = await invokeLambda(processXAPIStatementFunction.value, putXAPIStatementEvent);
    const records = await getStreamRecords(streamName.value, currentTime);

    expect(response.StatusCode).toEqual(200);
    expect(records.Records).toHaveLength(1);
  });
});
