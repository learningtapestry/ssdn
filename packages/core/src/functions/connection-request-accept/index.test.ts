import { buildConnection, buildConnectionRequest } from "../../../test-support/factories";
import { buildApiProxyHandlerEvent, fakeImpl, mocked } from "../../../test-support/jest-helper";
import { ProviderIssuedAcceptance } from "../../interfaces/exchange";
import DynamoConnectionRequestRepository from "../../repositories/dynamo-connection-request-repository";
import {
  getConnectionRequestRepository,
  getConnectionRequestService,
  getConnectionService,
  getMetadataService,
} from "../../services";
import AwsConnectionRequestService from "../../services/aws-connection-request-service";
import AwsConnectionService from "../../services/aws-connection-service";
import AwsSSDNMetadataService from "../../services/aws-ssdn-metadata-service";
import { handler } from "./";

jest.mock("../../services");

const fakeConnectionRequestRepo = fakeImpl<DynamoConnectionRequestRepository>({
  get: jest.fn((id) =>
    id === "1"
      ? Promise.resolve(buildConnectionRequest({ id: "1", acceptanceToken: "Test" }))
      : Promise.reject(),
  ),
});

const fakeConnectionRequestService = fakeImpl<AwsConnectionRequestService>({
  receiveProviderRejection: jest.fn(),
});

const fakeConnectionService = fakeImpl<AwsConnectionService>({
  createForProviderAcceptance: jest.fn(() =>
    Promise.resolve(
      buildConnection({
        connection: {
          arn: "TestArn",
          awsAccountId: "123456",
          externalId: "123456",
          roleName: "123456",
          ssdnId: "123456",
        },
      }),
    ),
  ),
});

const fakeMetadataService = fakeImpl<AwsSSDNMetadataService>({
  getPublicMetadata: jest.fn(() =>
    Promise.resolve({
      EventProcessorStream: "TestArn",
    }),
  ),
});

mocked(getConnectionRequestRepository).mockImplementation(() => fakeConnectionRequestRepo);
mocked(getConnectionRequestService).mockImplementation(() => fakeConnectionRequestService);
mocked(getConnectionService).mockImplementation(() => fakeConnectionService);
mocked(getMetadataService).mockImplementation(() => fakeMetadataService);

describe("ConnectionRequestAcceptFunction", () => {
  it("verifies authorization, rejects unauthorized", async () => {
    const response = handler(
      buildApiProxyHandlerEvent()
        .path({ id: "1" })
        .headers({ Authorization: "Bearer Fail" })
        .build(),
    );
    await expect(response).resolves.toEqual({
      body: JSON.stringify({
        errors: [
          {
            detail: "The authorization token could not be validated.",
            status: "403",
            title: "SSDNError",
          },
        ],
      }),
      statusCode: 403,
    });
  });

  it("receives rejections", async () => {
    const response = handler(
      buildApiProxyHandlerEvent()
        .path({ id: "1" })
        .headers({ Authorization: "Bearer Test" })
        .body({
          accepted: false,
        } as ProviderIssuedAcceptance)
        .build(),
    );
    await expect(response).resolves.toEqual({
      body: "",
      statusCode: 200,
    });
    expect(fakeConnectionRequestService.receiveProviderRejection).toHaveBeenCalledWith(
      buildConnectionRequest({ id: "1", acceptanceToken: "Test" }),
    );
  });

  it("receives acceptances", async () => {
    const response = handler(
      buildApiProxyHandlerEvent()
        .path({ id: "1" })
        .headers({ Authorization: "Bearer Test" })
        .body({
          accepted: true,
        } as ProviderIssuedAcceptance)
        .build(),
    );
    await expect(response).resolves.toEqual({
      body: JSON.stringify({
        externalConnection: { arn: "TestArn", externalId: "123456" },
        metadata: { EventProcessorStream: "TestArn" },
      }),
      statusCode: 200,
    });
  });
});
