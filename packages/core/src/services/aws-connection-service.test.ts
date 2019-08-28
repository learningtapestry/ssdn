import sortBy from "lodash/fp/sortBy";

import { buildConnection, buildConnectionRequest } from "../../test-support/factories";
import { fakeImpl, mocked } from "../../test-support/jest-helper";
import { SSDNError } from "../errors/ssdn-error";
import { AWS_SSDN, POLICIES } from "../interfaces/aws-metadata-keys";
import { ConsumerIssuedConnection } from "../interfaces/connection";
import {
  ConnectionRequestStatus,
  IncomingConnectionRequestStatus,
} from "../interfaces/connection-request";
import { Stream, StreamStatus, StreamType } from "../interfaces/stream";
import ConnectionRepository from "../repositories/connection-repository";
import { ConnectionRequestRepository } from "../repositories/connection-request-repository";
import AwsConnectionService from "./aws-connection-service";
import ConnectionRequestService from "./connection-request-service";
import ExchangeService from "./exchange-service";
import IamService from "./iam-service";
import SSDNMetadataService from "./ssdn-metadata-service";

const fakeConnectionRepository = fakeImpl<ConnectionRepository>({
  get: jest.fn(),
  put: jest.fn(),
});

const fakeConnectionRequestRepository = fakeImpl<ConnectionRequestRepository>({
  updateIncomingStatus: jest.fn(),
  updateStatus: jest.fn(),
});

const fakeConnectionRequestService = fakeImpl<ConnectionRequestService>({
  assertConnectionRequestUpdatable: jest.fn(),
});

const fakeExchangeService = fakeImpl<ExchangeService>({
  sendAcceptance: jest.fn(),
  sendRejection: jest.fn(),
  sendStreamUpdate: jest.fn(),
});

const fakeIamService = fakeImpl<IamService>({
  attachEndpointRolePolicy: jest.fn(),
  findOrCreateEndpointRole: jest.fn(),
  updateEndpointRoleInlinePolicy: jest.fn(),
});

const fakeMetadata = fakeImpl<SSDNMetadataService>({
  getEndpoint: jest.fn(() => Promise.resolve({ value: "https://red.com" })),
  getMetadataValue: jest.fn((key: string) =>
    Promise.resolve({
      value: ({
        [POLICIES.consumerPolicy]: "ConsumerPolicyArn",
        [POLICIES.providerPolicy]: "ProviderPolicyArn",
        [AWS_SSDN.awsAccountId]: "RedAccountId",
        [AWS_SSDN.ssdnId]: "RedSSDNId",
      } as any)[key],
    }),
  ),
  getPublicMetadata: jest.fn(() =>
    Promise.resolve({
      AwsRegion: "RedRegion",
      EventProcessorStream: "RedProcessorStream",
      UploadS3Bucket: "RedUploadS3Bucket",
    }),
  ),
});

const buildConnectionService = () =>
  new AwsConnectionService(
    fakeConnectionRepository,
    fakeConnectionRequestRepository,
    fakeConnectionRequestService,
    fakeExchangeService,
    fakeIamService,
    fakeMetadata,
  );

describe("AwsConnectionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createForConsumerRequest", () => {
    it("ensures the connection request can be updated", async () => {
      mocked(fakeConnectionRequestService.assertConnectionRequestUpdatable).mockRejectedValueOnce(
        new SSDNError("Cannot be updated"),
      );
      const connectionRequest = buildConnectionRequest();
      const service = buildConnectionService();
      const result = service.createForConsumerRequest(connectionRequest);
      await expect(result).rejects.toHaveProperty("message", "Cannot be updated");
      expect(fakeConnectionRequestService.assertConnectionRequestUpdatable).toHaveBeenCalledWith(
        connectionRequest,
      );
    });

    it("creates news connections, and sends an acceptance response", async () => {
      const connectionRequest = buildConnectionRequest({
        connection: {
          awsAccountId: "BlueAccountId",
          ssdnId: "BlueSSDNId",
        },
        consumerEndpoint: "https://blue.com",
        formats: ["Caliper", "xAPI"],
        id: "123456",
        namespace: "https://blue.com",
      });
      const acceptanceResponse: ConsumerIssuedConnection = {
        externalConnection: {
          arn: "BlueRedExternalArn",
          externalId: "BlueRedExternalId",
        },
        metadata: {
          AwsRegion: "BlueRegion",
          EventProcessorStream: "BlueStreamArn",
          UploadS3Bucket: "BlueUploadS3Bucket",
        },
      };
      mocked(fakeConnectionRepository.get).mockRejectedValueOnce(new Error("Not found"));
      mocked(fakeIamService.findOrCreateEndpointRole).mockResolvedValueOnce({
        arn: "RedBlueArn",
        externalId: "RedBlueExternalId",
        name: "ssdn_ex_red_blue",
      });
      mocked(fakeExchangeService.sendAcceptance).mockResolvedValueOnce(acceptanceResponse);

      const service = buildConnectionService();
      const newConnection = await service.createForConsumerRequest(connectionRequest);
      expect(newConnection.endpoint).toEqual("https://blue.com");
      expect(newConnection.connection).toEqual({
        arn: "RedBlueArn",
        awsAccountId: "BlueAccountId",
        externalId: "RedBlueExternalId",
        roleName: "ssdn_ex_red_blue",
        ssdnId: "BlueSSDNId",
      });
      expect(newConnection.externalConnection).toEqual({
        arn: "BlueRedExternalArn",
        externalId: "BlueRedExternalId",
      });
      expect(newConnection.inputStreams).toEqual([]);
      expect(newConnection.outputStreams).toEqual([
        { format: "Caliper", namespace: "https://blue.com", status: StreamStatus.Active },
        { format: "xAPI", namespace: "https://blue.com", status: StreamStatus.Active },
      ]);
      expect(newConnection.isConsumer).toBeTruthy();
      expect(newConnection.isProvider).toBeFalsy();
      expect(newConnection.metadata).toEqual({
        AwsRegion: "BlueRegion",
        EventProcessorStream: "BlueStreamArn",
        UploadS3Bucket: "BlueUploadS3Bucket",
      });

      // Side effects
      expect(fakeIamService.attachEndpointRolePolicy).toHaveBeenCalledWith(
        {
          value: "ConsumerPolicyArn",
        },
        "https://blue.com",
      );
      expect(fakeIamService.updateEndpointRoleInlinePolicy).toHaveBeenCalledWith(
        {
          Statement: [
            {
              Action: ["s3:listBucket"],
              Effect: "Allow",
              Resource: ["arn:aws:s3:::RedUploadS3Bucket"],
            },
            {
              Action: ["s3:GetObject"],
              Effect: "Allow",
              Resource: ["arn:aws:s3:::RedUploadS3Bucket/https://blue.com/Caliper/*"],
            },
            {
              Action: ["s3:GetObject"],
              Effect: "Allow",
              Resource: ["arn:aws:s3:::RedUploadS3Bucket/https://blue.com/xAPI/*"],
            },
          ],
          Version: "2012-10-17",
        },
        "https://blue.com",
      );
      expect(fakeExchangeService.sendAcceptance).toHaveBeenCalledWith(connectionRequest, {
        accepted: true,
        details: {
          connection: { awsAccountId: "RedAccountId", ssdnId: "RedSSDNId" },
          externalConnection: { arn: "RedBlueArn", externalId: "RedBlueExternalId" },
          metadata: {
            AwsRegion: "RedRegion",
            EventProcessorStream: "RedProcessorStream",
            UploadS3Bucket: "RedUploadS3Bucket",
          },
        },
      });
      expect(fakeConnectionRepository.put).toHaveBeenCalledWith(newConnection);
      expect(fakeConnectionRequestRepository.updateIncomingStatus).toHaveBeenCalledWith(
        connectionRequest.consumerEndpoint,
        connectionRequest.id,
        ConnectionRequestStatus.Accepted,
      );
    });

    it("finds and updates a connection when one already existed", async () => {
      const existingConnection = buildConnection({
        connection: {
          arn: "123456",
          awsAccountId: "123456",
          externalId: "123456",
          roleName: "123456",
          ssdnId: "123456",
        },
        creationDate: new Date(2019, 10, 1).toISOString(),
        endpoint: "https://blue.com",
        externalConnection: {
          arn: "123456",
          externalId: "123456",
        },
        inputStreams: [
          { format: "xAPI", namespace: "https://red.com", status: StreamStatus.Paused },
        ],
        isConsumer: false,
        isProvider: true,
        metadata: {
          AwsRegion: "TestRegion",
          EventProcessorStream: "123456",
          UploadS3Bucket: "123456",
        },
        outputStreams: [
          { format: "xAPI", namespace: "https://blue.com", status: StreamStatus.Paused },
        ],
      });
      const connectionRequest = buildConnectionRequest({
        connection: {
          awsAccountId: "BlueAccountId",
          ssdnId: "BlueSSDNId",
        },
        consumerEndpoint: "https://blue.com",
        formats: ["Caliper", "xAPI"],
        id: "123456",
        namespace: "https://blue.com",
      });
      const acceptanceResponse: ConsumerIssuedConnection = {
        externalConnection: {
          arn: "BlueRedExternalArn",
          externalId: "BlueRedExternalId",
        },
        metadata: {
          AwsRegion: "BlueRegion",
          EventProcessorStream: "BlueStreamArn",
          UploadS3Bucket: "BlueUploadS3Bucket",
        },
      };
      mocked(fakeConnectionRepository.get).mockResolvedValueOnce(existingConnection);
      mocked(fakeExchangeService.sendAcceptance).mockResolvedValueOnce(acceptanceResponse);

      const service = buildConnectionService();
      const newConnection = await service.createForConsumerRequest(connectionRequest);

      // Existing connection details, including previous streams, are preserved
      expect(newConnection.endpoint).toEqual(existingConnection.endpoint);
      expect(newConnection.creationDate).toEqual(new Date(2019, 10, 1).toISOString());
      expect(newConnection.connection).toEqual(existingConnection.connection);
      expect(newConnection.isProvider).toEqual(existingConnection.isProvider);
      expect(newConnection.inputStreams).toEqual(existingConnection.inputStreams);

      // A new stream is added, previous one is preserved
      expect(newConnection.outputStreams).toEqual([
        { format: "xAPI", namespace: "https://blue.com", status: StreamStatus.Paused },
        { format: "Caliper", namespace: "https://blue.com", status: StreamStatus.Active },
      ]);
      expect(newConnection.isConsumer).toBeTruthy();
      expect(newConnection.externalConnection).toEqual({
        arn: "BlueRedExternalArn",
        externalId: "BlueRedExternalId",
      });
      expect(newConnection.metadata).toEqual({
        AwsRegion: "BlueRegion",
        EventProcessorStream: "BlueStreamArn",
        UploadS3Bucket: "BlueUploadS3Bucket",
      });

      // Side effects
      expect(fakeIamService.attachEndpointRolePolicy).toHaveBeenCalledWith(
        {
          value: "ConsumerPolicyArn",
        },
        "https://blue.com",
      );
      expect(fakeExchangeService.sendAcceptance).toHaveBeenCalledWith(connectionRequest, {
        accepted: true,
        details: {
          connection: { awsAccountId: "RedAccountId", ssdnId: "RedSSDNId" },
          externalConnection: { arn: "123456", externalId: "123456" },
          metadata: {
            AwsRegion: "RedRegion",
            EventProcessorStream: "RedProcessorStream",
            UploadS3Bucket: "RedUploadS3Bucket",
          },
        },
      });
      expect(fakeConnectionRepository.put).toHaveBeenCalledWith(newConnection);
      expect(fakeConnectionRequestRepository.updateIncomingStatus).toHaveBeenCalledWith(
        connectionRequest.consumerEndpoint,
        connectionRequest.id,
        ConnectionRequestStatus.Accepted,
      );
    });
  });

  describe("createForProviderAcceptance", () => {
    it("ensures the connection request can be updated", async () => {
      mocked(fakeConnectionRequestService.assertConnectionRequestUpdatable).mockRejectedValueOnce(
        new SSDNError("Cannot be updated"),
      );
      const connectionRequest = buildConnectionRequest();
      const service = buildConnectionService();
      const result = service.createForProviderAcceptance(connectionRequest, {
        connection: { awsAccountId: "123456", ssdnId: "123456" },
        externalConnection: { arn: "123456", externalId: "123456" },
        metadata: { AwsRegion: "Test", EventProcessorStream: "123456", UploadS3Bucket: "123456" },
      });
      await expect(result).rejects.toHaveProperty("message", "Cannot be updated");
      expect(fakeConnectionRequestService.assertConnectionRequestUpdatable).toHaveBeenCalledWith(
        connectionRequest,
      );
    });

    it("creates new connections", async () => {
      const connectionRequest = buildConnectionRequest({
        formats: ["Caliper", "xAPI"],
        id: "123456",
        namespace: "https://red.com",
        providerEndpoint: "https://blue.com",
      });
      const acceptanceDetails = {
        connection: {
          awsAccountId: "BlueAccountId",
          ssdnId: "BlueSSDNId",
        },
        externalConnection: {
          arn: "RedBlueExternalArn",
          externalId: "RedBlueExternalId",
        },
        metadata: {
          AwsRegion: "BlueRegion",
          EventProcessorStream: "BlueStreamArn",
          UploadS3Bucket: "BlueUploadS3Bucket",
        },
      };
      mocked(fakeConnectionRepository.get).mockRejectedValueOnce(new Error("Not found"));
      mocked(fakeIamService.findOrCreateEndpointRole).mockResolvedValueOnce({
        arn: "BlueRedArn",
        externalId: "BlueRedExternalId",
      });
      const service = buildConnectionService();
      const newConnection = await service.createForProviderAcceptance(
        connectionRequest,
        acceptanceDetails,
      );
      expect(newConnection.endpoint).toEqual("https://blue.com");
      expect(newConnection.connection).toEqual({
        arn: "BlueRedArn",
        awsAccountId: "BlueAccountId",
        externalId: "BlueRedExternalId",
        ssdnId: "BlueSSDNId",
      });
      expect(newConnection.externalConnection).toEqual({
        arn: "RedBlueExternalArn",
        externalId: "RedBlueExternalId",
      });
      expect(newConnection.outputStreams).toEqual([]);
      expect(newConnection.inputStreams).toEqual([
        { format: "Caliper", namespace: "https://red.com", status: StreamStatus.Active },
        { format: "xAPI", namespace: "https://red.com", status: StreamStatus.Active },
      ]);
      expect(newConnection.isConsumer).toBeFalsy();
      expect(newConnection.isProvider).toBeTruthy();
      expect(newConnection.metadata).toEqual({
        AwsRegion: "BlueRegion",
        EventProcessorStream: "BlueStreamArn",
        UploadS3Bucket: "BlueUploadS3Bucket",
      });

      // Side effects
      expect(fakeIamService.attachEndpointRolePolicy).toHaveBeenCalledWith(
        {
          value: "ProviderPolicyArn",
        },
        "https://blue.com",
      );
      expect(fakeIamService.updateEndpointRoleInlinePolicy).toHaveBeenCalledWith(
        {
          Statement: [],
          Version: "2012-10-17",
        },
        "https://blue.com",
      );
      expect(fakeConnectionRepository.put).toHaveBeenCalledWith(newConnection);
      expect(fakeConnectionRequestRepository.updateStatus).toHaveBeenCalledWith(
        connectionRequest.id,
        ConnectionRequestStatus.Accepted,
      );
    });

    it("finds and updates a connection when one already existed", async () => {
      const existingConnection = buildConnection({
        connection: {
          arn: "123456",
          awsAccountId: "123456",
          externalId: "123456",
          roleName: "123456",
          ssdnId: "123456",
        },
        creationDate: new Date(2019, 10, 1).toISOString(),
        endpoint: "https://blue.com",
        externalConnection: {
          arn: "123456",
          externalId: "123456",
        },
        inputStreams: [
          { format: "xAPI", namespace: "https://red.com", status: StreamStatus.Paused },
        ],
        isConsumer: true,
        isProvider: false,
        metadata: {
          AwsRegion: "Test",
          EventProcessorStream: "123456",
          UploadS3Bucket: "123456",
        },
        outputStreams: [
          { format: "xAPI", namespace: "https://blue.com", status: StreamStatus.Active },
        ],
      });
      const connectionRequest = buildConnectionRequest({
        formats: ["Caliper", "xAPI"],
        id: "123456",
        namespace: "https://red.com",
        providerEndpoint: "https://blue.com",
      });
      mocked(fakeConnectionRepository.get).mockResolvedValueOnce(existingConnection);

      const service = buildConnectionService();
      const newConnection = await service.createForProviderAcceptance(connectionRequest, {
        connection: {
          awsAccountId: "654321",
          ssdnId: "654321",
        },
        externalConnection: {
          arn: "654321",
          externalId: "654321",
        },
        metadata: {
          AwsRegion: "Test",
          EventProcessorStream: "654321",
          UploadS3Bucket: "TestS3Bucket",
        },
      });

      // Existing connection details, including previous streams, are preserved
      expect(newConnection.endpoint).toEqual("https://blue.com");
      expect(newConnection.creationDate).toEqual(new Date(2019, 10, 1).toISOString());
      expect(newConnection.connection).toEqual(existingConnection.connection);
      expect(newConnection.isConsumer).toEqual(existingConnection.isConsumer);
      expect(newConnection.outputStreams).toEqual(existingConnection.outputStreams);

      // A new stream is added, previous one is preserved
      expect(newConnection.inputStreams).toEqual([
        { format: "xAPI", namespace: "https://red.com", status: StreamStatus.Paused },
        { format: "Caliper", namespace: "https://red.com", status: StreamStatus.Active },
      ]);
      expect(newConnection.isProvider).toBeTruthy();
      expect(newConnection.externalConnection).toEqual({
        arn: "654321",
        externalId: "654321",
      });
      expect(newConnection.metadata).toEqual({
        AwsRegion: "Test",
        EventProcessorStream: "654321",
        UploadS3Bucket: "TestS3Bucket",
      });

      // Side effects
      expect(fakeIamService.attachEndpointRolePolicy).toHaveBeenCalledWith(
        {
          value: "ProviderPolicyArn",
        },
        existingConnection.endpoint,
      );
      expect(fakeConnectionRepository.put).toHaveBeenCalledWith(newConnection);
      expect(fakeConnectionRequestRepository.updateStatus).toHaveBeenCalledWith(
        connectionRequest.id,
        ConnectionRequestStatus.Accepted,
      );
    });
  });

  describe("rejectConsumerRequest", () => {
    it("ensures the connection request can be updated", async () => {
      mocked(fakeConnectionRequestService.assertConnectionRequestUpdatable).mockRejectedValueOnce(
        new SSDNError("Cannot be updated"),
      );
      const connectionRequest = buildConnectionRequest();
      const service = buildConnectionService();
      const result = service.rejectConsumerRequest(connectionRequest);
      await expect(result).rejects.toHaveProperty("message", "Cannot be updated");
      expect(fakeConnectionRequestService.assertConnectionRequestUpdatable).toHaveBeenCalledWith(
        connectionRequest,
      );
    });

    it("rejects connection requests", async () => {
      const connectionRequest = buildConnectionRequest();
      const service = buildConnectionService();
      await service.rejectConsumerRequest(connectionRequest);
      expect(fakeExchangeService.sendRejection).toHaveBeenCalledWith(connectionRequest);
      expect(fakeConnectionRequestRepository.updateIncomingStatus).toHaveBeenCalledWith(
        connectionRequest.consumerEndpoint,
        connectionRequest.id,
        ConnectionRequestStatus.Rejected,
      );
    });

    it("updates the connection request status before and after sending", async () => {
      const connectionRequest = buildConnectionRequest();
      const service = buildConnectionService();
      await service.rejectConsumerRequest(connectionRequest);
      expect(fakeConnectionRequestRepository.updateIncomingStatus).toHaveBeenCalledWith(
        connectionRequest.consumerEndpoint,
        connectionRequest.id,
        IncomingConnectionRequestStatus.RejectedPending,
      );
      expect(fakeConnectionRequestRepository.updateIncomingStatus).toHaveBeenCalledWith(
        connectionRequest.consumerEndpoint,
        connectionRequest.id,
        ConnectionRequestStatus.Rejected,
      );
    });
  });

  describe("updateStream", () => {
    it("updates a stream in a connection, notifies the external endpoint", async () => {
      const connection = buildConnection({
        endpoint: "https://blue.com",
        inputStreams: [
          {
            format: "xAPI",
            namespace: "https://red.com",
            status: StreamStatus.Active,
          },
          {
            format: "Caliper",
            namespace: "https://red.com",
            status: StreamStatus.Active,
          },
        ],
      });

      const stream: Stream = {
        format: "xAPI",
        namespace: "https://red.com",
        status: StreamStatus.Paused,
      };

      const connectionService = buildConnectionService();
      const newConnection = await connectionService.updateStream(
        connection,
        stream,
        StreamType.Input,
        true,
      );

      const sorted = sortBy<Stream>((s) => s.format);
      expect(sorted(newConnection.inputStreams)).toEqual(
        sorted([
          {
            format: "xAPI",
            namespace: "https://red.com",
            status: StreamStatus.Paused,
          },
          {
            format: "Caliper",
            namespace: "https://red.com",
            status: StreamStatus.Active,
          },
        ]),
      );

      expect(fakeConnectionRepository.put).toHaveBeenCalledWith(newConnection);
      expect(fakeExchangeService.sendStreamUpdate).toHaveBeenCalledWith(newConnection, {
        stream: {
          format: "xAPI",
          namespace: "https://red.com",
          status: StreamStatus.Paused,
        },
        streamType: "output",
      });
    });

    it("rejects creation of new streams", async () => {
      const connection = buildConnection({
        endpoint: "https://blue.com",
        inputStreams: [
          {
            format: "xAPI",
            namespace: "https://red.com",
            status: StreamStatus.Active,
          },
        ],
      });
      const stream: Stream = {
        format: "Caliper",
        namespace: "https://red.com",
        status: StreamStatus.Active,
      };
      const connectionService = buildConnectionService();
      const updateResult = connectionService.updateStream(
        connection,
        stream,
        StreamType.Input,
        true,
      );
      await expect(updateResult).rejects.toHaveProperty(
        "message",
        "A stream update has been attempted for a stream which does not exist.",
      );
    });

    it("rejects updating an externally paused stream", async () => {
      const connection = buildConnection({
        endpoint: "https://blue.com",
        inputStreams: [
          {
            format: "xAPI",
            namespace: "https://red.com",
            status: StreamStatus.PausedExternal,
          },
        ],
      });
      const stream: Stream = {
        format: "xAPI",
        namespace: "https://red.com",
        status: StreamStatus.Active,
      };
      const connectionService = buildConnectionService();
      const updateResult = connectionService.updateStream(
        connection,
        stream,
        StreamType.Input,
        true,
      );
      await expect(updateResult).rejects.toHaveProperty(
        "message",
        "A stream can't be resumed after it has been paused externally.",
      );
    });

    it("rejects overwriting a stream", async () => {
      const connection = buildConnection({
        endpoint: "https://blue.com",
        inputStreams: [
          {
            format: "xAPI",
            namespace: "https://red.com",
            status: StreamStatus.Paused,
          },
        ],
      });
      const stream: Stream = {
        format: "xAPI",
        namespace: "https://red.com",
        status: StreamStatus.Paused,
      };
      mocked(fakeConnectionRepository.get).mockResolvedValueOnce(connection);

      const connectionService = buildConnectionService();
      const updateResult = connectionService.updateStream(
        connection,
        stream,
        StreamType.Input,
        true,
      );
      await expect(updateResult).rejects.toHaveProperty(
        "message",
        "The status has already been set.",
      );
    });

    it("updates a stream, when the update is issued externally", async () => {
      const connection = buildConnection({
        endpoint: "https://blue.com",
        inputStreams: [
          {
            format: "xAPI",
            namespace: "https://red.com",
            status: StreamStatus.Active,
          },
          {
            format: "Caliper",
            namespace: "https://red.com",
            status: StreamStatus.Active,
          },
        ],
      });

      const stream: Stream = {
        format: "xAPI",
        namespace: "https://red.com",
        status: StreamStatus.Paused,
      };

      const connectionService = buildConnectionService();
      const newConnection = await connectionService.updateStream(
        connection,
        stream,
        StreamType.Input,
        false,
      );

      const sorted = sortBy<Stream>((s) => s.format);
      expect(sorted(newConnection.inputStreams)).toEqual(
        sorted([
          {
            format: "xAPI",
            namespace: "https://red.com",
            status: StreamStatus.PausedExternal,
          },
          {
            format: "Caliper",
            namespace: "https://red.com",
            status: StreamStatus.Active,
          },
        ]),
      );

      expect(fakeConnectionRepository.put).toHaveBeenCalledWith(newConnection);
      expect(fakeExchangeService.sendStreamUpdate).not.toHaveBeenCalled();
    });

    it("rejects resumes to an internally paused stream", async () => {
      const connection = buildConnection({
        endpoint: "https://blue.com",
        inputStreams: [
          {
            format: "xAPI",
            namespace: "https://red.com",
            status: StreamStatus.Paused,
          },
        ],
      });
      const stream: Stream = {
        format: "xAPI",
        namespace: "https://red.com",
        status: StreamStatus.Active,
      };
      const connectionService = buildConnectionService();
      const updateResult = connectionService.updateStream(
        connection,
        stream,
        StreamType.Input,
        false,
      );
      await expect(updateResult).rejects.toHaveProperty(
        "message",
        "A stream can't be resumed externally.",
      );
    });
  });
});
