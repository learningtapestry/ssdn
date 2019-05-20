import { buildConnectionRequest } from "../../../test-support/factories";
import { buildApiProxyHandlerEvent, fakeImpl, mocked } from "../../../test-support/jest-helper";
import DynamoConnectionRequestRepository from "../../repositories/dynamo-connection-request-repository";
import { getConnectionRequestRepository, getConnectionService } from "../../services";
import AwsConnectionService from "../../services/aws-connection-service";
import { handler } from "./";

jest.mock("../../services");

const id = "1";
const consumerEndpoint = "https://test.com";
const connectionRequest = buildConnectionRequest({ id, consumerEndpoint });

const fakeConnectionRequestRepo = fakeImpl<DynamoConnectionRequestRepository>({
  getIncoming: jest.fn(() => Promise.resolve(connectionRequest)),
});

const fakeConnectionService = fakeImpl<AwsConnectionService>({
  createForConsumerRequest: jest.fn(() => {}),
  rejectConsumerRequest: jest.fn(() => {}),
});

mocked(getConnectionRequestRepository).mockImplementation(() => fakeConnectionRequestRepo);
mocked(getConnectionService).mockImplementation(() => fakeConnectionService);

describe("IncomingConnectionRequestAcceptFunction", () => {
  it("creates a connection for accepted requests", async () => {
    const response = handler(
      buildApiProxyHandlerEvent()
        .body({ accepted: true, endpoint: consumerEndpoint, id })
        .build(),
    );
    await expect(response).resolves.toEqual({
      body: "",
      statusCode: 200,
    });
    expect(fakeConnectionRequestRepo.getIncoming).toHaveBeenCalledWith(consumerEndpoint, id);
    expect(fakeConnectionService.createForConsumerRequest).toHaveBeenCalledWith(connectionRequest);
  });

  it("updates status for rejected requests", async () => {
    const response = handler(
      buildApiProxyHandlerEvent()
        .body({ accepted: false, endpoint: consumerEndpoint, id })
        .build(),
    );
    await expect(response).resolves.toEqual({
      body: "",
      statusCode: 200,
    });
    expect(fakeConnectionRequestRepo.getIncoming).toHaveBeenCalledWith(consumerEndpoint, id);
    expect(fakeConnectionService.rejectConsumerRequest).toHaveBeenCalledWith(connectionRequest);
  });
});
