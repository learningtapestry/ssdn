import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

import { fakeImpl, mocked } from "../../../test-support/jest-helper";
import caliperEvent from "../../../test-support/lambda-events/post-caliper-envelope-event.json";
import { AWS_SSDN } from "../../interfaces/aws-metadata-keys";
import { EventRepository } from "../../repositories/event-repository";
import { getEventRepository, getMetadataService } from "../../services";
import AwsSSDNMetadataService from "../../services/aws-ssdn-metadata-service";
import { handler } from "./index";

jest.mock("../../services");

const fakeMetadataService = fakeImpl<AwsSSDNMetadataService>({
  getMetadataValue: jest.fn((k: string) =>
    Promise.resolve(
      ({
        [AWS_SSDN.namespace]: "Test",
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

describe("ProcessCaliperEnvelopeFunction", () => {
  it("stores an event for a well formed Caliper request", async () => {
    const result = (await handler(
      (caliperEvent as unknown) as APIGatewayProxyEvent,
      {} as Context,
      () => {},
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toEqual(201);
  });

  it("checks the request has the proper content type", async () => {
    const badEvent = { ...caliperEvent, headers: { "Content-Type": "application/www-urlencoded" } };

    const result = (await handler(
      (badEvent as unknown) as APIGatewayProxyEvent,
      {} as Context,
      () => {},
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toEqual(415);
    expect(JSON.parse(result.body)).toEqual({ message: "Content type must be 'application/json'" });
  });
});
