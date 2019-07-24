import isEqual from "lodash/fp/isEqual";

import { SSDNError } from "../errors/ssdn-error";
import { AWS_SSDN, POLICIES } from "../interfaces/aws-metadata-keys";
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
import GenerateInlinePolicy from "./generate-inline-policy";
import IamService from "./iam-service";
import SSDNMetadataService from "./ssdn-metadata-service";

export default class AwsConnectionService implements ConnectionService {
  private repository: ConnectionRepository;
  private connectionRequestRepository: ConnectionRequestRepository;
  private connectionRequestService: ConnectionRequestService;
  private iamService: IamService;
  private exchangeService: ExchangeService;
  private metadata: SSDNMetadataService;

  constructor(
    repository: ConnectionRepository,
    connectionRequestRepository: ConnectionRequestRepository,
    connectionRequestService: ConnectionRequestService,
    exchangeService: ExchangeService,
    iamService: IamService,
    metadata: SSDNMetadataService,
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

    logger.info(
      // tslint:disable-next-line:max-line-length
      `Processing connection request ${connectionRequest.consumerEndpoint} - ${connectionRequest.id}`,
    );

    let connection;
    let isNew;
    [connection, isNew] = await this.findOrInitializeConnection(
      connectionRequest.consumerEndpoint,
      {
        awsAccountId: connectionRequest.connection.awsAccountId,
        ssdnId: connectionRequest.connection.ssdnId,
      },
    );

    logger.info(`Initialized connection request.`);

    const awsAccountId = await this.metadata.getMetadataValue(AWS_SSDN.awsAccountId);
    const ssdnId = await this.metadata.getMetadataValue(AWS_SSDN.ssdnId);
    const acceptanceResponse = await this.exchangeService.sendAcceptance(connectionRequest, {
      accepted: true,
      details: {
        connection: {
          awsAccountId: awsAccountId.value,
          ssdnId: ssdnId.value,
        },
        externalConnection: {
          arn: connection.connection.arn,
          externalId: connection.connection.externalId,
        },
        metadata: await this.metadata.getPublicMetadata(),
      },
    });

    logger.info(`Sent request acceptance.`);

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
        connectionRequest.formats.map((c) => ({
          format: c,
          namespace: connectionRequest.namespace,
          status: StreamStatus.Active,
        })),
      ),
    };

    await this.iamService.attachEndpointRolePolicy(
      await this.metadata.getMetadataValue(POLICIES.consumerPolicy),
      connection.endpoint,
    );

    await this.iamService.updateEndpointRoleInlinePolicy(
      GenerateInlinePolicy.generate(await this.metadata.getPublicMetadata(), connection),
      connection.endpoint,
    );

    logger.info(`Updated connection policies.`);

    await this.repository.put(connection);

    await this.connectionRequestRepository.updateIncomingStatus(
      connectionRequest.consumerEndpoint,
      connectionRequest.id,
      ConnectionRequestStatus.Accepted,
    );

    logger.info(`Saved connection.`);

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
    logger.info(
      // tslint:disable-next-line:max-line-length
      `Processing connection request ${connectionRequest.consumerEndpoint} - ${connectionRequest.id}`,
    );

    await this.connectionRequestService.assertConnectionRequestUpdatable(connectionRequest);

    let connection;
    let isNew;
    [connection, isNew] = await this.findOrInitializeConnection(
      connectionRequest.providerEndpoint,
      {
        awsAccountId: connectionDetails.connection.awsAccountId,
        ssdnId: connectionDetails.connection.ssdnId,
      },
    );

    logger.info(`Initialized connection.`);

    if (!isNew && !isEqual(connection.externalConnection, connectionDetails.externalConnection)) {
      logger.info(
        // tslint:disable-next-line:max-line-length
        `The external connection details for ${connection.endpoint} have been updated and are being reassigned.`,
      );
    }

    if (!isNew && !isEqual(connection.metadata, connectionDetails.metadata)) {
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
        connectionRequest.formats.map((c) => ({
          format: c,
          namespace: connectionRequest.namespace,
          status: StreamStatus.Active,
        })),
      ),
      isProvider: true,
      metadata: connectionDetails.metadata,
    };

    await this.iamService.attachEndpointRolePolicy(
      await this.metadata.getMetadataValue(POLICIES.providerPolicy),
      connection.endpoint,
    );

    await this.iamService.updateEndpointRoleInlinePolicy(
      GenerateInlinePolicy.generate(await this.metadata.getPublicMetadata(), connection),
      connection.endpoint,
    );

    logger.info(`Updated connection policies.`);

    await this.repository.put(connection);

    await this.connectionRequestRepository.updateStatus(
      connectionRequest.id,
      ConnectionRequestStatus.Accepted,
    );

    logger.info(`Saved connection.`);

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
    connectionOptions: { awsAccountId: string; ssdnId: string },
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
          roleName: "",
          ssdnId: "",
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
        connection.endpoint,
        connectionOptions.awsAccountId,
      );
      connection.connection = {
        arn: role.arn,
        awsAccountId: connectionOptions.awsAccountId,
        externalId: role.externalId,
        roleName: role.name,
        ssdnId: connectionOptions.ssdnId,
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
    const { namespace, format } = stream;
    let status = stream.status;
    const streamAccessor = type === "input" ? "inputStreams" : "outputStreams";

    const oldStream = connection[streamAccessor].find(
      (e) => e.namespace === namespace && e.format === format,
    );

    if (!oldStream) {
      throw new SSDNError(
        "A stream update has been attempted for a stream which does not exist.",
        400,
      );
    }

    if (oldStream.status === StreamStatus.PausedExternal && isInternalUpdate) {
      throw new SSDNError("A stream can't be resumed after it has been paused externally.", 400);
    }

    if (oldStream.status === StreamStatus.Paused && !isInternalUpdate) {
      throw new SSDNError("A stream can't be resumed externally.", 400);
    }

    if (oldStream.status === status) {
      throw new SSDNError("The status has already been set.");
    }

    if (status === StreamStatus.Paused && !isInternalUpdate) {
      status = StreamStatus.PausedExternal;
    }

    const updatedStreams = connection[streamAccessor].filter((s) => s !== oldStream);

    const newStream: Stream = {
      format,
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
        const existsInA = a.find((ae) => ae.format === e.format && ae.namespace === e.namespace);
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
