import { buildConnectionRequest } from "../../../test-support/factories";
import { buildApiProxyHandlerEvent, fakeImpl, mocked } from "../../../test-support/jest-helper";
import { SSDNError } from "../../errors/ssdn-error";
import { getConnectionRequestService, getExchangeService } from "../../services";
import AwsConnectionRequestService from "../../services/aws-connection-request-service";
import AwsExchangeService from "../../services/aws-exchange-service";
import { handler } from "./";

jest.mock("../../services");

const fakeConnectionRequestService = fakeImpl<AwsConnectionRequestService>({
  createIncoming: jest.fn(),
});

const fakeExchangeService = fakeImpl<AwsExchangeService>({
  verifyConnectionRequest: jest.fn(),
});

mocked(getConnectionRequestService).mockImplementation(() => fakeConnectionRequestService);
mocked(getExchangeService).mockImplementation(() => fakeExchangeService);

describe("ConnectionRequestAcceptFunction", () => {
  it("verifies connection requests before accepting", async () => {
    mocked(fakeExchangeService.verifyConnectionRequest).mockImplementationOnce(() =>
      Promise.reject(new SSDNError("Rejected!")),
    );
    const response = handler(
      buildApiProxyHandlerEvent()
        .body(buildConnectionRequest({ consumerEndpoint: "https://test.com" }))
        .build(),
    );
    await expect(response).resolves.toEqual({
      body: JSON.stringify({ errors: [{ detail: "Rejected!", title: "SSDNError" }] }),
      statusCode: 500,
    });
  });

  it("creates incoming connections", async () => {
    const incomingConnectionRequest = buildConnectionRequest({
      consumerEndpoint: "https://test.com",
    });
    const response = handler(
      buildApiProxyHandlerEvent()
        .body(incomingConnectionRequest)
        .build(),
    );
    await expect(response).resolves.toEqual({
      body: "",
      statusCode: 200,
    });
    expect(fakeConnectionRequestService.createIncoming).toHaveBeenLastCalledWith(
      incomingConnectionRequest,
    );
  });
});
