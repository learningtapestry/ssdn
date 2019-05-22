import isEqual from "lodash/fp/isEqual";

import { NucleusError } from "../errors/nucleus-error";
import { AWS_NUCLEUS, POLICIES } from "../interfaces/aws-metadata-keys";
import { Connection, ProviderIssuedConnection } from "../interfaces/connection";
import {
  ConnectionRequest,
  ConnectionRequestStatus,
  IncomingConnectionRequestStatus,
} from "../interfaces/connection-request";
import { StreamUpdate } from "../interfaces/exchange";
import { Stream, StreamStatus, StreamType } from "../interfaces/stream";
import logger from "../logger";
import ConnectionRepository from "../repositories/connection-repository";
import { ConnectionRequestRepository } from "../repositories/connection-request-repository";
import ConnectionRequestService from "./connection-request-service";
import ConnectionService from "./connection-service";
import ExchangeService from "./exchange-service";
import IamService from "./iam-service";
import NucleusMetadataService from "./nucleus-metadata-service";

export default class AwsConnectionService implements ConnectionService {
  private repository: ConnectionRepository;
  private connectionRequestRepository: ConnectionRequestRepository;
  private connectionRequestService: ConnectionRequestService;
  private iamService: IamService;
  private exchangeService: ExchangeService;
  private metadata: NucleusMetadataService;

  constructor(
    repository: ConnectionRepository,
    connectionRequestRepository: ConnectionRequestRepository,
    connectionRequestService: ConnectionRequestService,
    exchangeService: ExchangeService,
    iamService: IamService,
    metadata: NucleusMetadataService,
  ) {
    this.repository = repository;
    this.connectionRequestRepository = connectionRequestRepository;
    this.connectionRequestService = connectionRequestService;
    this.exchangeService = exchangeService;
    this.iamService = iamService;
    this.metadata = metadata;
  }

  public async createForConsumerRequest(connectionRequest: ConnectionRequest) {
    await this.connectionRequestService.assertConnectionRequestUpdatable(connectionRequest);

    let connection;
    let isNew;
    [connection, isNew] = await this.findOrInitializeConnection(
      connectionRequest.consumerEndpoint,
      {
        awsAccountId: connectionRequest.connection.awsAccountId,
        nucleusId: connectionRequest.connection.nucleusId,
      },
    );

    const awsAccountId = await this.metadata.getMetadataValue(AWS_NUCLEUS.awsAccountId);
    const nucleusId = await this.metadata.getMetadataValue(AWS_NUCLEUS.nucleusId);
    const acceptanceResponse = await this.exchangeService.sendAcceptance(connectionRequest, {
      accepted: true,
      details: {
        connection: {
          awsAccountId: awsAccountId.value,
          nucleusId: nucleusId.value,
        },
        externalConnection: {
          arn: connection.connection.arn,
          externalId: connection.connection.externalId,
        },
        metadata: await this.metadata.getPublicMetadata(),
      },
    });

    await this.iamService.attachEndpointRolePolicy(
      await this.metadata.getMetadataValue(POLICIES.consumerPolicy),
      await this.metadata.getEndpoint(),
      connectionRequest.consumerEndpoint,
      connectionRequest.connection.awsAccountId,
    );

    connection = {
      ...connection,
      externalConnection: {
        ...connection.externalConnection,
        arn: acceptanceResponse.externalConnection.arn,
        externalId: acceptanceResponse.externalConnection.externalId,
      },
      isConsumer: true,
      metadata: acceptanceResponse.metadata,
      outputStreams: this.mergeStreams(
        connection.outputStreams,
        connectionRequest.channels.map((c) => ({
          channel: c,
          namespace: connectionRequest.namespace,
          status: StreamStatus.Active,
        })),
      ),
    };

    await this.repository.put(connection);

    await this.connectionRequestRepository.updateIncomingStatus(
      connectionRequest.consumerEndpoint,
      connectionRequest.id,
      ConnectionRequestStatus.Accepted,
    );

    return connection;
  }

  public async rejectConsumerRequest(connectionRequest: ConnectionRequest) {
    await this.connectionRequestService.assertConnectionRequestUpdatable(connectionRequest);

    await this.connectionRequestRepository.updateIncomingStatus(
      connectionRequest.consumerEndpoint,
      connectionRequest.id,
      IncomingConnectionRequestStatus.RejectedPending,
    );

    await this.exchangeService.sendRejection(connectionRequest);

    await this.connectionRequestRepository.updateIncomingStatus(
      connectionRequest.consumerEndpoint,
      connectionRequest.id,
      ConnectionRequestStatus.Rejected,
    );
  }

  public async createForProviderAcceptance(
    connectionRequest: ConnectionRequest,
    connectionDetails: ProviderIssuedConnection,
  ) {
    await this.connectionRequestService.assertConnectionRequestUpdatable(connectionRequest);

    let connection;
    let isNew;
    [connection, isNew] = await this.findOrInitializeConnection(
      connectionRequest.providerEndpoint,
      {
        awsAccountId: connectionDetails.connection.awsAccountId,
        nucleusId: connectionDetails.connection.nucleusId,
      },
    );

    if (isNew && !isEqual(connection.externalConnection, connectionDetails.externalConnection)) {
      logger.info(
        `The external connection details for ${
          connection.endpoint
        } have been updated and are being reassigned.`,
      );
    }

    if (isNew && !isEqual(connection.metadata, connectionDetails.metadata)) {
      logger.info(
        `The metadata for ${connection.endpoint} has been updated and are being reassigned.`,
      );
    }

    connection = {
      ...connection,
      externalConnection: {
        ...connection.externalConnection,
        arn: connectionDetails.externalConnection.arn,
        externalId: connectionDetails.externalConnection.externalId,
      },
      inputStreams: this.mergeStreams(
        connection.inputStreams,
        connectionRequest.channels.map((c) => ({
          channel: c,
          namespace: connectionRequest.namespace,
          status: StreamStatus.Active,
        })),
      ),
      isProvider: true,
      metadata: connectionDetails.metadata,
    };

    await this.iamService.attachEndpointRolePolicy(
      await this.metadata.getMetadataValue(POLICIES.providerPolicy),
      await this.metadata.getEndpoint(),
      connectionRequest.providerEndpoint,
      connection.connection.awsAccountId,
    );

    await this.repository.put(connection);

    await this.connectionRequestRepository.updateStatus(
      connectionRequest.id,
      ConnectionRequestStatus.Accepted,
    );

    return connection;
  }

  public async updateStream(
    connection: Connection,
    stream: Stream,
    type: StreamType,
    isInternalUpdate: boolean,
  ) {
    ({ connection, stream } = this.updateStreamInConnection(
      connection,
      stream,
      type,
      isInternalUpdate,
    ));
    await this.repository.put(connection);

    if (isInternalUpdate) {
      // Notify the external endpoint.
      const update: StreamUpdate = {
        stream,
        streamType: type === StreamType.Input ? StreamType.Output : StreamType.Input,
      };
      await this.exchangeService.sendStreamUpdate(connection, update);
    }

    return connection;
  }

  private async findOrInitializeConnection(
    endpoint: string,
    connectionOptions: { awsAccountId: string; nucleusId: string },
  ): Promise<[Connection, boolean]> {
    let connection: Connection;
    let isNew = false;

    try {
      connection = await this.repository.get(endpoint);
    } catch {
      connection = {
        connection: {
          arn: "",
          awsAccountId: "",
          externalId: "",
          nucleusId: "",
          roleName: "",
        },
        creationDate: "",
        endpoint,
        externalConnection: {
          arn: "",
          externalId: "",
        },
        inputStreams: [],
        isConsumer: false,
        isProvider: false,
        metadata: {
          EventProcessorStream: "",
          UploadS3Bucket: "",
        },
        outputStreams: [],
        updateDate: "",
      };
      isNew = true;
    }

    if (isNew) {
      const role = await this.iamService.findOrCreateEndpointRole(
        await this.metadata.getEndpoint(),
        connection.endpoint,
        connectionOptions.awsAccountId,
      );
      connection.connection = {
        arn: role.arn,
        awsAccountId: connectionOptions.awsAccountId,
        externalId: role.externalId,
        nucleusId: connectionOptions.nucleusId,
        roleName: role.name,
      };
    }

    return [connection, isNew];
  }

  private updateStreamInConnection(
    connection: Connection,
    stream: Stream,
    type: string,
    isInternalUpdate: boolean,
  ) {
    const { namespace, channel } = stream;
    let status = stream.status;
    const streamAccessor = type === "input" ? "inputStreams" : "outputStreams";

    const oldStream = connection[streamAccessor].find(
      (e) => e.namespace === namespace && e.channel === channel,
    );

    if (!oldStream) {
      throw new NucleusError(
        "A stream update has been attempted for a stream which does not exist.",
        400,
      );
    }

    if (oldStream.status === StreamStatus.PausedExternal && isInternalUpdate) {
      throw new NucleusError("A stream can't be resumed after it has been paused externally.", 400);
    }

    if (oldStream.status === StreamStatus.Paused && !isInternalUpdate) {
      throw new NucleusError("A stream can't be resumed externally.", 400);
    }

    if (oldStream.status === status) {
      throw new NucleusError("The status has already been set.");
    }

    if (status === StreamStatus.Paused && !isInternalUpdate) {
      status = StreamStatus.PausedExternal;
    }

    const updatedStreams = connection[streamAccessor].filter((s) => s !== oldStream);

    const newStream: Stream = {
      channel,
      namespace,
      status,
    };

    updatedStreams.push(newStream);

    connection[streamAccessor] = updatedStreams;

    return {
      connection,
      stream: newStream,
    };
  }

  private mergeStreams(a: Stream[] | undefined, b: Stream[] | undefined) {
    if (a && b) {
      const merged = [...a];
      for (const e of b) {
        const existsInA = a.find((ae) => ae.channel === e.channel && ae.namespace === e.namespace);
        if (!existsInA) {
          merged.push(e);
        }
      }
      return merged;
    }
    if (a) {
      return a;
    }
    if (b) {
      return b;
    }
    return [];
  }
}
