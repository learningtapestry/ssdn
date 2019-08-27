import Kinesis from "aws-sdk/clients/kinesis";
import { TemporaryCredentials } from "aws-sdk/lib/core";
import Axios from "axios";

import { buildConnection, buildConnectionRequest, buildEvent } from "../../test-support/factories";
import { fakeImpl, mocked } from "../../test-support/jest-helper";
import Event from "../interfaces/event";
import { ProviderIssuedAcceptance, StreamUpdate } from "../interfaces/exchange";
import { StreamStatus, StreamType } from "../interfaces/stream";
import KinesisEventRepository from "../repositories/kinesis-event-repository";
import AwsExchangeService from "./aws-exchange-service";
import ExternalSSDNMetadataService from "./external-ssdn-metadata-service";
import SSDNMetadataService from "./ssdn-metadata-service";
import TemporaryCredentialsFactory from "./temporary-credentials-factory";

jest.mock("axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
  request: jest.fn(),
}));

const fakeMetadata = fakeImpl<SSDNMetadataService>({
  getEndpoint: jest.fn(() => Promise.resolve({ value: "https://red.com" })),
  getMetadataValue: jest.fn(() => Promise.resolve({ value: "RedSSDNId" })),
});

const fakeEventRepo = fakeImpl<KinesisEventRepository>({
  storeBatch: jest.fn(),
});

const fakeTempCredentials = ({
  accessKeyId: "1234",
  getPromise: jest.fn(),
  secretAccessKey: "1234",
  sessionToken: "1234",
} as unknown) as TemporaryCredentials;

const fakeTempCredentialsFactory = fakeImpl<TemporaryCredentialsFactory>({
  getCredentials: jest.fn(() => Promise.resolve(fakeTempCredentials)),
});

const fakeEventRepoFactory = jest.fn(
  (
    p1: ConstructorParameters<typeof ExternalSSDNMetadataService>,
    p2: ConstructorParameters<typeof Kinesis>,
  ) => fakeEventRepo,
);

const buildExchangeService = () =>
  new AwsExchangeService(fakeMetadata, fakeTempCredentialsFactory, fakeEventRepoFactory);

const buildProviderAcceptance: () => ProviderIssuedAcceptance = () => ({
  accepted: true,
  details: {
    connection: {
      awsAccountId: "test",
      ssdnId: "test",
    },
    externalConnection: {
      arn: "test",
      externalId: "test",
    },
    metadata: {
      EventProcessorStream: "test",
      UploadS3Bucket: "test",
    },
  },
});

describe("AwsExchangeService", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("sendAcceptance", () => {
    it("it sends an acceptance response via HTTP", async () => {
      const connectionRequest = buildConnectionRequest({
        acceptanceToken: "1234",
        consumerEndpoint: "https://blue.com",
        id: "1234",
      });
      const consumerResponse = {
        externalConnection: { arn: "test", externalId: "test" },
        metadata: { EventProcessorStream: "test" },
      };
      mocked(Axios.post).mockResolvedValueOnce({ data: consumerResponse });
      const serviceResponse = await buildExchangeService().sendAcceptance(
        connectionRequest,
        buildProviderAcceptance(),
      );
      expect(serviceResponse).toEqual(consumerResponse);
      expect(Axios.post).toHaveBeenCalledWith(
        "https://blue.com/connections/requests/1234/accept",
        buildProviderAcceptance(),
        { headers: { Authorization: "Bearer 1234" } },
      );
    });
  });

  describe("sendConnectionRequest", () => {
    it("sends a connection request via HTTP", async () => {
      const connectionRequest = buildConnectionRequest({ providerEndpoint: "https://blue.com" });
      mocked(Axios.post).mockResolvedValueOnce(undefined);
      await buildExchangeService().sendConnectionRequest(connectionRequest);
      expect(Axios.post).toHaveBeenCalledWith(
        "https://blue.com/connections/incoming-requests",
        connectionRequest,
      );
    });
  });

  describe("sendEvents", () => {
    it("pushes events to the other instance's kinesis stream", async () => {
      const connection = buildConnection({
        endpoint: "https://blue.com",
        externalConnection: { arn: "123456", externalId: "123456" },
      });
      const events = [buildEvent(), buildEvent(), buildEvent()];
      await buildExchangeService().sendEvents(connection, events);
      expect(fakeTempCredentialsFactory.getCredentials).toHaveBeenCalledWith("123456", "123456");
      expect(fakeEventRepoFactory).toHaveBeenCalledWith(
        [connection],
        [{ credentials: fakeTempCredentials }],
      );
      expect(fakeEventRepo.storeBatch).toHaveBeenCalled();
      const pushedEvents = mocked(fakeEventRepo.storeBatch).mock.calls[0][0] as Event[];
      expect(pushedEvents.length).toEqual(3);
      for (const event of pushedEvents) {
        expect(event.source).toEqual({ endpoint: "https://red.com" });
      }
    });
  });

  describe("sendRejection", () => {
    it("sends a rejection response via HTTP", async () => {
      const connectionRequest = buildConnectionRequest({
        acceptanceToken: "1234",
        consumerEndpoint: "https://blue.com",
        id: "1234",
      });
      await buildExchangeService().sendRejection(connectionRequest);
      expect(Axios.post).toHaveBeenCalledWith(
        "https://blue.com/connections/requests/1234/accept",
        { accepted: false },
        { headers: { Authorization: "Bearer 1234" } },
      );
    });
  });

  describe("sendStreamUpdate", () => {
    it("sends a stream update via a sigv4 HTTP request", async () => {
      const connection = buildConnection({
        endpoint: "https://blue.com",
        externalConnection: { arn: "123456", externalId: "123456" },
      });
      const streamUpdate: StreamUpdate = {
        stream: { format: "xAPI", namespace: "blue.com", status: StreamStatus.Paused },
        streamType: StreamType.Input,
      };
      await buildExchangeService().sendStreamUpdate(connection, streamUpdate);

      // tslint:disable: max-line-length
      expect(Axios.request).toHaveBeenCalledWith({
        body: JSON.stringify({
          stream: { format: "xAPI", namespace: "blue.com", status: "paused" },
          streamType: "input",
        }),
        data: {
          stream: {
            format: "xAPI",
            namespace: "blue.com",
            status: "paused",
          },
          streamType: "input",
        },
        headers: {
          Authorization: expect.stringContaining("AWS4-HMAC-SHA256 Credential=1234"),
          "Content-Type": "application/json",
          "X-Amz-Date": expect.stringMatching(/[0-9A-Z]+/),
          "X-Amz-Security-Token": "1234",
        },
        host: "blue.com",
        method: "POST",
        path: "/connections/streams/update",
        url: "https://blue.com/connections/streams/update",
      });
      // tslint:enable: max-line-length
    });
  });

  describe("verifyConnectionRequest", () => {
    it("verifies a request via HTTP", async () => {
      const connectionRequest = buildConnectionRequest({
        acceptanceToken: "1234",
        consumerEndpoint: "https://blue.com",
        id: "1234",
      });
      await buildExchangeService().verifyConnectionRequest(connectionRequest);
      expect(Axios.get).toHaveBeenCalledWith("https://blue.com/connections/requests/1234/verify", {
        headers: { Authorization: "Bearer 1234" },
      });
    });

    it("raises and error when the request can't be verified", async () => {
      const connectionRequest = buildConnectionRequest({
        acceptanceToken: "1234",
        consumerEndpoint: "https://blue.com",
        id: "1234",
      });
      mocked(Axios.get).mockRejectedValueOnce(new Error("Not found"));
      const result = buildExchangeService().verifyConnectionRequest(connectionRequest);
      await expect(result).rejects.toHaveProperty(
        "message",
        "We could not verify the request with the consumer endpoint.",
      );
      expect(Axios.get).toHaveBeenCalledWith("https://blue.com/connections/requests/1234/verify", {
        headers: { Authorization: "Bearer 1234" },
      });
    });
  });
});
