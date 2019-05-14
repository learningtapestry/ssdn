import { buildApiProxyHandlerEvent, fakeImpl, mocked } from "../../../test-support/jest-helper";
import { getConnectionService } from "../../services";
import AwsConnectionService from "../../services/aws-connection-service";
import { handler } from "./";

jest.mock("../../services");

const fakeConnectionService = fakeImpl<AwsConnectionService>({
  updateStream: jest.fn(() => Promise.resolve()),
  updateStreamByExternal: jest.fn(() => Promise.resolve()),
});

mocked(getConnectionService).mockImplementation(() => fakeConnectionService);

describe("ConnectionRequestAcceptFunction", () => {
  it("updates streams, for updates issued by the own nucleus instance", async () => {
    const update = {
      channel: "XAPI",
      endpoint: "https://test.com",
      namespace: "test.com",
      status: "active",
      type: "input",
    };

    const response = await handler(
      buildApiProxyHandlerEvent()
        .body(update)
        .requestContext({
          identity: {
            userArn: "arn:aws:iam::111111111111:role/Test",
          },
        })
        .build(),
    );

    expect(response).toEqual({ body: "", statusCode: 200 });
    expect(fakeConnectionService.updateStream).toHaveBeenCalledWith(
      "https://test.com",
      "test.com",
      "XAPI",
      "active",
      "input",
    );
  });

  it("updates streams, for updates issued by external nucleus instances", async () => {
    const update = {
      channel: "XAPI",
      endpoint: "https://test.com",
      namespace: "test.com",
      status: "active",
      type: "input",
    };

    const response = await handler(
      buildApiProxyHandlerEvent()
        .body(update)
        .requestContext({
          identity: {
            userArn: "arn:aws:iam::111111111111:role/nucleus_ex_123456_789012",
          },
        })
        .build(),
    );

    expect(response).toEqual({ body: "", statusCode: 200 });
    expect(fakeConnectionService.updateStreamByExternal).toHaveBeenCalledWith(
      "nucleus_ex_123456_789012",
      "https://test.com",
      "test.com",
      "XAPI",
      "active",
      "input",
    );
  });
});
