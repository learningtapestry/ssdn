import { NucleusError } from "../errors/nucleus-error";
import { readEnv } from "../helpers/app-helper";
import { Channel } from "../interfaces/channel";
import {
  Connection,
  ExternalConnectionDetails,
  ProviderIssuedConnectionDetails,
} from "../interfaces/connection";
import {
  ConnectionRequest,
  ConnectionRequestStatus,
  IncomingConnectionRequestStatus,
} from "../interfaces/connection-request";
import { StreamUpdate } from "../interfaces/exchange";
import { Stream, StreamStatus } from "../interfaces/stream";
import ConnectionRepository from "../repositories/connection-repository";
import { ConnectionRequestRepository } from "../repositories/connection-request-repository";
import { POLICIES } from "./aws-entity-names";
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

    let connection = await this.findOrInitializeConnection(connectionRequest.consumerEndpoint, {
      awsAccountId: connectionRequest.connection.awsAccountId,
      nucleusId: connectionRequest.connection.nucleusId,
    });

    const acceptanceResponse = await this.exchangeService.sendAcceptance(connectionRequest, {
      accepted: true,
      details: {
        connection: {
          awsAccountId: readEnv("NUCLEUS_AWS_ACCOUNT_ID"),
          nucleusId: readEnv("NUCLEUS_ID"),
        },
        externalConnection: {
          arn: connection.connection.arn,
          externalId: connection.connection.externalId,
        },
      },
    });

    await this.iamService.attachEndpointRolePolicy(
      connectionRequest.connection.awsAccountId,
      connectionRequest.consumerEndpoint,
      POLICIES.consumerPolicy,
    );

    connection = {
      ...connection,
      externalConnection: {
        ...connection.externalConnection,
        arn: acceptanceResponse.externalConnection.arn,
        externalId: acceptanceResponse.externalConnection.externalId,
      },
      isConsumer: true,
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
    connectionDetails: ProviderIssuedConnectionDetails,
  ) {
    await this.connectionRequestService.assertConnectionRequestUpdatable(connectionRequest);

    let connection = await this.findOrInitializeConnection(connectionRequest.providerEndpoint, {
      awsAccountId: connectionDetails.connection.awsAccountId,
      nucleusId: connectionDetails.connection.nucleusId,
    });

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
    };

    await this.iamService.attachEndpointRolePolicy(
      connection.connection.awsAccountId,
      connectionRequest.providerEndpoint,
      POLICIES.providerPolicy,
    );

    await this.repository.put(connection);

    await this.connectionRequestRepository.updateStatus(
      connectionRequest.id,
      ConnectionRequestStatus.Accepted,
    );

    return connection;
  }

  public async updateStream(
    endpoint: string,
    namespace: string,
    channel: string,
    status: StreamStatus,
    type: "input" | "output",
  ) {
    let connection = await this.repository.get(endpoint);
    let stream;
    ({ connection, stream } = this.updateStreamInConnection(
      connection,
      namespace,
      channel,
      status,
      type,
    ));
    await this.repository.put(connection);

    const ownEndpoint = await this.metadata.getEndpoint();
    const update: StreamUpdate = {
      channel: stream.channel,
      endpoint: ownEndpoint,
      namespace: stream.namespace,
      status: stream.status,
      type: type === "input" ? "output" : "input",
    };
    await this.exchangeService.sendStreamUpdate(connection, update);

    return connection;
  }

  public async updateStreamByExternal(
    userId: string,
    endpoint: string,
    namespace: string,
    channel: string,
    status: StreamStatus,
    type: "input" | "output",
  ) {
    let connection = await this.repository.get(endpoint);
    this.assertConnectionOwnership(connection.externalConnection, userId);
    connection = this.updateStreamInConnection(connection, namespace, channel, status, type, true)
      .connection;
    await this.repository.put(connection);
    return connection;
  }

  private async assertConnectionOwnership(
    connectionDetails: ExternalConnectionDetails,
    userId: string,
  ) {
    const roleName = connectionDetails.arn.split(":")[5].split("/")[1];
    if (roleName !== userId) {
      throw new NucleusError("The user is not authorized for this action.", 401);
    }
  }

  private async findOrInitializeConnection(
    endpoint: string,
    connectionOptions: { awsAccountId: string; nucleusId: string },
  ) {
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
        nucleusId: connectionOptions.nucleusId,
      };
    }

    return connection;
  }

  private updateStreamInConnection(
    connection: Connection,
    namespace: string,
    channel: string,
    status: StreamStatus,
    type: string,
    isExternal: boolean = false,
  ) {
    const streamAccessor = type === "input" ? "inputStreams" : "outputStreams";

    const oldStream = connection[streamAccessor]!.find(
      (e) => e.namespace === namespace && e.channel === channel,
    );

    if (oldStream!.status === StreamStatus.PausedExternal && !isExternal) {
      throw new NucleusError("A stream can't be resumed after it has been paused externally.", 400);
    }

    if (oldStream!.status === status) {
      throw new NucleusError("The status has already been set.");
    }

    if (status === StreamStatus.Paused && isExternal) {
      status = StreamStatus.PausedExternal;
    }

    const newInputs = connection[streamAccessor]!.filter(
      (e) => e.namespace !== namespace && e.channel !== channel,
    );

    const newStream: Stream = {
      channel: channel as Channel,
      namespace,
      status,
    };
    newInputs.push(newStream);

    connection[streamAccessor] = newInputs;

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
