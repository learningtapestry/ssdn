import { buildConnection } from "../../../test-support/factories";
import { buildApiProxyHandlerEvent, fakeImpl, mocked } from "../../../test-support/jest-helper";
import { StreamUpdate } from "../../interfaces/exchange";
import { StreamStatus, StreamType } from "../../interfaces/stream";
import ConnectionRepository from "../../repositories/connection-repository";
import { getConnectionRepository, getConnectionService } from "../../services";
import AwsConnectionService from "../../services/aws-connection-service";
import { handler } from "./";

jest.mock("../../services");

const fakeConnectionService = fakeImpl<AwsConnectionService>({
  updateStream: jest.fn(() => Promise.resolve()),
});

const fakeConnectionRepository = fakeImpl<ConnectionRepository>({
  get: jest.fn(() => Promise.resolve(buildConnection())),
  getByConnectionSecret: jest.fn(() => Promise.resolve(buildConnection())),
});

mocked(getConnectionRepository).mockImplementation(() => fakeConnectionRepository);
mocked(getConnectionService).mockImplementation(() => fakeConnectionService);

describe("ConnectionRequestAcceptFunction", () => {
  beforeEach(() => jest.clearAllMocks());

  it("updates streams, for updates issued by the own nucleus instance", async () => {
    const update: StreamUpdate = {
      endpoint: "https://test.com",
      stream: {
        channel: "XAPI",
        namespace: "test.com",
        status: StreamStatus.Active,
      },
      streamType: StreamType.Input,
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
    expect(fakeConnectionRepository.get).toHaveBeenCalledWith("https://test.com");
    expect(fakeConnectionRepository.getByConnectionSecret).not.toHaveBeenCalled();
    expect(fakeConnectionService.updateStream).toHaveBeenCalledWith(
      buildConnection(),
      {
        channel: "XAPI",
        namespace: "test.com",
        status: StreamStatus.Active,
      },
      StreamType.Input,
      true,
    );
  });

  it("updates streams, for updates issued by external nucleus instances", async () => {
    const update: StreamUpdate = {
      stream: {
        channel: "XAPI",
        namespace: "test.com",
        status: StreamStatus.Active,
      },
      streamType: StreamType.Input,
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
    expect(fakeConnectionRepository.get).not.toHaveBeenCalled();
    expect(fakeConnectionRepository.getByConnectionSecret).toHaveBeenCalledWith(
      "nucleus_ex_123456_789012",
    );
    expect(fakeConnectionService.updateStream).toHaveBeenCalledWith(
      buildConnection(),
      {
        channel: "XAPI",
        namespace: "test.com",
        status: StreamStatus.Active,
      },
      StreamType.Input,
      false,
    );
  });
});
