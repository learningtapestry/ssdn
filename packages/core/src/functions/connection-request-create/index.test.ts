import { buildConnectionRequest } from "../../../test-support/factories";
import { buildApiProxyHandlerEvent, fakeImpl, mocked } from "../../../test-support/jest-helper";
import { getConnectionRequestService } from "../../services";
import AwsConnectionRequestService from "../../services/aws-connection-request-service";
import { handler } from "./";

jest.mock("../../services");

const fakeConnectionRequestService = fakeImpl<AwsConnectionRequestService>({
  create: jest.fn(),
});

mocked(getConnectionRequestService).mockImplementation(() => fakeConnectionRequestService);

describe("ConnectionRequestCreateFunction", () => {
  it("creates a connection request", async () => {
    const response = handler(
      buildApiProxyHandlerEvent()
        .body(buildConnectionRequest({ consumerEndpoint: "https://test.com" }))
        .build(),
    );
    await expect(response).resolves.toEqual({
      body: JSON.stringify({
        acceptanceToken: "",
        connection: { awsAccountId: "", ssdnId: "" },
        consumerEndpoint: "https://test.com",
        creationDate: "",
        formats: [],
        id: "",
        namespace: "",
        organization: "",
        providerEndpoint: "",
        status: "created",
        type: "",
        verificationCode: "",
      }),
      statusCode: 200,
    });
  });
});
