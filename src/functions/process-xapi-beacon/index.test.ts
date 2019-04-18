import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

import beaconEvent from "../../../test-support/lambda-events/get-xapi-beacon-event.json";
import { handler } from "./index";

describe("ProcessXAPIBeaconFunction", () => {
  it("stores an event for a well formed xAPI request", async () => {
    const result = (await handler(
      (beaconEvent as unknown) as APIGatewayProxyEvent,
      {} as Context,
      () => {
        // Do nothing
      },
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toEqual(200);
  });

  it("fails for a request with bad data", async () => {
    const badEvent = {
      ...beaconEvent,
      queryStringParameters: {
        apiKey: "1234567890",
        event: "{}",
      },
    };

    const result = (await handler(
      (badEvent as unknown) as APIGatewayProxyEvent,
      {} as Context,
      () => {
        // Do nothing
      },
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toEqual(422);
  });
});
