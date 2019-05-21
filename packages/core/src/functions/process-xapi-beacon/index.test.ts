import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

import { fakeImpl, mocked } from "../../../test-support/jest-helper";
import beaconEvent from "../../../test-support/lambda-events/get-xapi-beacon-event.json";
import { AWS_NUCLEUS } from "../../interfaces/aws-metadata-keys";
import { EventRepository } from "../../repositories/event-repository";
import { getEventRepository, getMetadataService } from "../../services";
import AwsNucleusMetadataService from "../../services/aws-nucleus-metadata-service";
import { handler } from "./index";

jest.mock("../../services");

const fakeMetadataService = fakeImpl<AwsNucleusMetadataService>({
  getMetadataValue: jest.fn((k: string) =>
    Promise.resolve(
      ({
        [AWS_NUCLEUS.namespace]: "Test",
      } as any)[k],
    ),
  ),
});

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
mocked(getMetadataService).mockImplementation(() => fakeMetadataService);

describe("ProcessXAPIBeaconFunction", () => {
  it("stores an event for a well formed xAPI request", async () => {
    const result = (await handler(
      (beaconEvent as unknown) as APIGatewayProxyEvent,
      {} as Context,
      () => {},
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
