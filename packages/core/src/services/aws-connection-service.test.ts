import sortBy from "lodash/fp/sortBy";

import { buildConnection, buildConnectionRequest } from "../../test-support/factories";
import { fakeImpl, mocked } from "../../test-support/jest-helper";
import { NucleusError } from "../errors/nucleus-error";
import { AWS_NUCLEUS, POLICIES } from "../interfaces/aws-metadata-keys";
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
import NucleusMetadataService from "./nucleus-metadata-service";

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
});

const fakeMetadata = fakeImpl<NucleusMetadataService>({
  getEndpoint: jest.fn(() => Promise.resolve({ value: "https://red.com" })),
  getMetadataValue: jest.fn((key: string) =>
    Promise.resolve({
      value: ({
        [POLICIES.consumerPolicy]: "ConsumerPolicyArn",
        [POLICIES.providerPolicy]: "ProviderPolicyArn",
        [AWS_NUCLEUS.awsAccountId]: "RedAccountId",
        [AWS_NUCLEUS.nucleusId]: "RedNucleusId",
      } as any)[key],
    }),
  ),
  getPublicMetadata: jest.fn(() =>
    Promise.resolve({
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
        new NucleusError("Cannot be updated"),
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
        channels: ["S3", "XAPI"],
        connection: {
          awsAccountId: "BlueAccountId",
          nucleusId: "BlueNucleusId",
        },
        consumerEndpoint: "https://blue.com",
        id: "123456",
        namespace: "https://blue.com",
      });
      const acceptanceResponse: ConsumerIssuedConnection = {
        externalConnection: {
          arn: "BlueRedExternalArn",
          externalId: "BlueRedExternalId",
        },
        metadata: {
          EventProcessorStream: "BlueStreamArn",
          UploadS3Bucket: "BlueUploadS3Bucket",
        },
      };
      mocked(fakeConnectionRepository.get).mockRejectedValueOnce(new Error("Not found"));
      mocked(fakeIamService.findOrCreateEndpointRole).mockResolvedValueOnce({
        arn: "RedBlueArn",
        externalId: "RedBlueExternalId",
        name: "nucleus_ex_red_blue",
      });
      mocked(fakeExchangeService.sendAcceptance).mockResolvedValueOnce(acceptanceResponse);

      const service = buildConnectionService();
      const newConnection = await service.createForConsumerRequest(connectionRequest);
      expect(newConnection.endpoint).toEqual("https://blue.com");
      expect(newConnection.connection).toEqual({
        arn: "RedBlueArn",
        awsAccountId: "BlueAccountId",
        externalId: "RedBlueExternalId",
        nucleusId: "BlueNucleusId",
        roleName: "nucleus_ex_red_blue",
      });
      expect(newConnection.externalConnection).toEqual({
        arn: "BlueRedExternalArn",
        externalId: "BlueRedExternalId",
      });
      expect(newConnection.inputStreams).toEqual([]);
      expect(newConnection.outputStreams).toEqual([
        { channel: "S3", namespace: "https://blue.com", status: StreamStatus.Active },
        { channel: "XAPI", namespace: "https://blue.com", status: StreamStatus.Active },
      ]);
      expect(newConnection.isConsumer).toBeTruthy();
      expect(newConnection.isProvider).toBeFalsy();
      expect(newConnection.metadata).toEqual({
        EventProcessorStream: "BlueStreamArn",
        UploadS3Bucket: "BlueUploadS3Bucket",
      });

      // Side effects
      expect(fakeIamService.attachEndpointRolePolicy).toHaveBeenCalledWith(
        {
          value: "ConsumerPolicyArn",
        },
        {
          value: "https://red.com",
        },
        "https://blue.com",
        "BlueAccountId",
      );
      expect(fakeExchangeService.sendAcceptance).toHaveBeenCalledWith(connectionRequest, {
        accepted: true,
        details: {
          connection: { awsAccountId: "RedAccountId", nucleusId: "RedNucleusId" },
          externalConnection: { arn: "RedBlueArn", externalId: "RedBlueExternalId" },
          metadata: {
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
          nucleusId: "123456",
          roleName: "123456",
        },
        creationDate: new Date(2019, 10, 1).toISOString(),
        endpoint: "https://blue.com",
        externalConnection: {
          arn: "123456",
          externalId: "123456",
        },
        inputStreams: [
          { channel: "XAPI", namespace: "https://red.com", status: StreamStatus.Paused },
        ],
        isConsumer: false,
        isProvider: true,
        metadata: {
          EventProcessorStream: "123456",
          UploadS3Bucket: "123456",
        },
        outputStreams: [
          { channel: "XAPI", namespace: "https://blue.com", status: StreamStatus.Paused },
        ],
      });
      const connectionRequest = buildConnectionRequest({
        channels: ["S3", "XAPI"],
        connection: {
          awsAccountId: "BlueAccountId",
          nucleusId: "BlueNucleusId",
        },
        consumerEndpoint: "https://blue.com",
        id: "123456",
        namespace: "https://blue.com",
      });
      const acceptanceResponse: ConsumerIssuedConnection = {
        externalConnection: {
          arn: "BlueRedExternalArn",
          externalId: "BlueRedExternalId",
        },
        metadata: {
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
        { channel: "XAPI", namespace: "https://blue.com", status: StreamStatus.Paused },
        { channel: "S3", namespace: "https://blue.com", status: StreamStatus.Active },
      ]);
      expect(newConnection.isConsumer).toBeTruthy();
      expect(newConnection.externalConnection).toEqual({
        arn: "BlueRedExternalArn",
        externalId: "BlueRedExternalId",
      });
      expect(newConnection.metadata).toEqual({
        EventProcessorStream: "BlueStreamArn",
        UploadS3Bucket: "BlueUploadS3Bucket",
      });

      // Side effects
      expect(fakeIamService.attachEndpointRolePolicy).toHaveBeenCalledWith(
        {
          value: "ConsumerPolicyArn",
        },
        {
          value: "https://red.com",
        },
        "https://blue.com",
        "BlueAccountId",
      );
      expect(fakeExchangeService.sendAcceptance).toHaveBeenCalledWith(connectionRequest, {
        accepted: true,
        details: {
          connection: { awsAccountId: "RedAccountId", nucleusId: "RedNucleusId" },
          externalConnection: { arn: "123456", externalId: "123456" },
          metadata: {
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
        new NucleusError("Cannot be updated"),
      );
      const connectionRequest = buildConnectionRequest();
      const service = buildConnectionService();
      const result = service.createForProviderAcceptance(connectionRequest, {
        connection: { awsAccountId: "123456", nucleusId: "123456" },
        externalConnection: { arn: "123456", externalId: "123456" },
        metadata: { EventProcessorStream: "123456", UploadS3Bucket: "123456" },
      });
      await expect(result).rejects.toHaveProperty("message", "Cannot be updated");
      expect(fakeConnectionRequestService.assertConnectionRequestUpdatable).toHaveBeenCalledWith(
        connectionRequest,
      );
    });

    it("creates new connections", async () => {
      const connectionRequest = buildConnectionRequest({
        channels: ["S3", "XAPI"],
        id: "123456",
        namespace: "https://red.com",
        providerEndpoint: "https://blue.com",
      });
      const acceptanceDetails = {
        connection: {
          awsAccountId: "BlueAccountId",
          nucleusId: "BlueNucleusId",
        },
        externalConnection: {
          arn: "RedBlueExternalArn",
          externalId: "RedBlueExternalId",
        },
        metadata: {
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
        nucleusId: "BlueNucleusId",
      });
      expect(newConnection.externalConnection).toEqual({
        arn: "RedBlueExternalArn",
        externalId: "RedBlueExternalId",
      });
      expect(newConnection.outputStreams).toEqual([]);
      expect(newConnection.inputStreams).toEqual([
        { channel: "S3", namespace: "https://red.com", status: StreamStatus.Active },
        { channel: "XAPI", namespace: "https://red.com", status: StreamStatus.Active },
      ]);
      expect(newConnection.isConsumer).toBeFalsy();
      expect(newConnection.isProvider).toBeTruthy();
      expect(newConnection.metadata).toEqual({
        EventProcessorStream: "BlueStreamArn",
        UploadS3Bucket: "BlueUploadS3Bucket",
      });

      // Side effects
      expect(fakeIamService.attachEndpointRolePolicy).toHaveBeenCalledWith(
        {
          value: "ProviderPolicyArn",
        },
        {
          value: "https://red.com",
        },
        "https://blue.com",
        "BlueAccountId",
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
          nucleusId: "123456",
          roleName: "123456",
        },
        creationDate: new Date(2019, 10, 1).toISOString(),
        endpoint: "https://blue.com",
        externalConnection: {
          arn: "123456",
          externalId: "123456",
        },
        inputStreams: [
          { channel: "XAPI", namespace: "https://red.com", status: StreamStatus.Paused },
        ],
        isConsumer: true,
        isProvider: false,
        metadata: {
          EventProcessorStream: "123456",
          UploadS3Bucket: "123456",
        },
        outputStreams: [
          { channel: "XAPI", namespace: "https://blue.com", status: StreamStatus.Active },
        ],
      });
      const connectionRequest = buildConnectionRequest({
        channels: ["S3", "XAPI"],
        id: "123456",
        namespace: "https://red.com",
        providerEndpoint: "https://blue.com",
      });
      mocked(fakeConnectionRepository.get).mockResolvedValueOnce(existingConnection);

      const service = buildConnectionService();
      const newConnection = await service.createForProviderAcceptance(connectionRequest, {
        connection: {
          awsAccountId: "654321",
          nucleusId: "654321",
        },
        externalConnection: {
          arn: "654321",
          externalId: "654321",
        },
        metadata: {
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
        { channel: "XAPI", namespace: "https://red.com", status: StreamStatus.Paused },
        { channel: "S3", namespace: "https://red.com", status: StreamStatus.Active },
      ]);
      expect(newConnection.isProvider).toBeTruthy();
      expect(newConnection.externalConnection).toEqual({
        arn: "654321",
        externalId: "654321",
      });
      expect(newConnection.metadata).toEqual({
        EventProcessorStream: "654321",
        UploadS3Bucket: "TestS3Bucket",
      });

      // Side effects
      expect(fakeIamService.attachEndpointRolePolicy).toHaveBeenCalledWith(
        {
          value: "ProviderPolicyArn",
        },
        {
          value: "https://red.com",
        },
        existingConnection.endpoint,
        existingConnection.connection.awsAccountId,
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
        new NucleusError("Cannot be updated"),
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
            channel: "XAPI",
            namespace: "https://red.com",
            status: StreamStatus.Active,
          },
          {
            channel: "S3",
            namespace: "https://red.com",
            status: StreamStatus.Active,
          },
        ],
      });

      const stream: Stream = {
        channel: "XAPI",
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

      const sorted = sortBy<Stream>((s) => s.channel);
      expect(sorted(newConnection.inputStreams)).toEqual(
        sorted([
          {
            channel: "XAPI",
            namespace: "https://red.com",
            status: StreamStatus.Paused,
          },
          {
            channel: "S3",
            namespace: "https://red.com",
            status: StreamStatus.Active,
          },
        ]),
      );

      expect(fakeConnectionRepository.put).toHaveBeenCalledWith(newConnection);
      expect(fakeExchangeService.sendStreamUpdate).toHaveBeenCalledWith(newConnection, {
        stream: {
          channel: "XAPI",
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
            channel: "XAPI",
            namespace: "https://red.com",
            status: StreamStatus.Active,
          },
        ],
      });
      const stream: Stream = {
        channel: "S3",
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
            channel: "XAPI",
            namespace: "https://red.com",
            status: StreamStatus.PausedExternal,
          },
        ],
      });
      const stream: Stream = {
        channel: "XAPI",
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
            channel: "XAPI",
            namespace: "https://red.com",
            status: StreamStatus.Paused,
          },
        ],
      });
      const stream: Stream = {
        channel: "XAPI",
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
            channel: "XAPI",
            namespace: "https://red.com",
            status: StreamStatus.Active,
          },
          {
            channel: "S3",
            namespace: "https://red.com",
            status: StreamStatus.Active,
          },
        ],
      });

      const stream: Stream = {
        channel: "XAPI",
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

      const sorted = sortBy<Stream>((s) => s.channel);
      expect(sorted(newConnection.inputStreams)).toEqual(
        sorted([
          {
            channel: "XAPI",
            namespace: "https://red.com",
            status: StreamStatus.PausedExternal,
          },
          {
            channel: "S3",
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
            channel: "XAPI",
            namespace: "https://red.com",
            status: StreamStatus.Paused,
          },
        ],
      });
      const stream: Stream = {
        channel: "XAPI",
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
