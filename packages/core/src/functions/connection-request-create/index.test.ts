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
        channels: [],
        connection: { awsAccountId: "", nucleusId: "" },
        consumerEndpoint: "https://test.com",
        creationDate: "",
        email: "",
        extension: "",
        firstName: "",
        id: "",
        lastName: "",
        namespace: "",
        organization: "",
        phoneNumber: "",
        providerEndpoint: "",
        status: "created",
        title: "",
        type: "",
        verificationCode: "",
      }),
      statusCode: 200,
    });
  });
});
