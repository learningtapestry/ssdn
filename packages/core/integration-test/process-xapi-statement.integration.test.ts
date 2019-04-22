import { currentStack, getOutputValue, getStreamRecords, invokeLambda } from "../test-support/aws";
import putXAPIStatementEvent from "../test-support/lambda-events/put-xapi-statement-event.json";

describe("Process xAPI Statement Function", () => {
  let processXAPIStatementFunction: string;

  beforeAll(async () => {
    jest.setTimeout(15000);
    processXAPIStatementFunction = await getOutputValue(
      "ProcessXAPIStatementFunction",
      currentStack(),
    );
  });

  it("stores the event in the stream", async () => {
    const currentTime = new Date();

    const response = await invokeLambda(processXAPIStatementFunction, putXAPIStatementEvent);
    const records = await getStreamRecords(currentTime);

    expect(response.StatusCode).toEqual(200);
    expect(records.Records).toHaveLength(1);
  });
});
