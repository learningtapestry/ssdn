import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

import { fakeImpl, mocked } from "../../../test-support/jest-helper";
import xApiEvent from "../../../test-support/lambda-events/put-xapi-statement-event.json";
import { EventRepository } from "../../repositories/event-repository";
import { getEventRepository } from "../../services";
import { handler } from "./index";

jest.mock("../../services");

const fakeEventRepository = fakeImpl<EventRepository>({
  store: jest.fn(() =>
    Promise.resolve({
      EncryptionType: "123456",
      SequenceNumber: "123456",
      ShardId: "123456",
    }),
  ),
});

mocked(getEventRepository).mockImplementation(() => fakeEventRepository);

describe("ProcessXAPIStatementFunction", () => {
  it("stores an event for a well formed xAPI request", async () => {
    const result = (await handler(
      (xApiEvent as unknown) as APIGatewayProxyEvent,
      {} as Context,
      () => {},
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toEqual(200);
  });

  it("fails for a request with bad arguments", async () => {
    const badEvent = {
      ...xApiEvent,
      headers: {
        "X-Experience-API-Version": "",
      },
    };

    const result = (await handler(
      (badEvent as unknown) as APIGatewayProxyEvent,
      {} as Context,
      () => {
        // Do nothing
      },
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toEqual(400);
  });
});
