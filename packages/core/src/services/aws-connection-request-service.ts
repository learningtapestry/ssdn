import generate from "nanoid/generate";
import uuid from "uuid/v4";

import { NucleusError } from "../errors/nucleus-error";
import { isoDate, readEnv } from "../helpers/app-helper";
import { LAMBDAS } from "../interfaces/aws-metadata-keys";
import {
  ConnectionRequest,
  ConnectionRequestStatus,
  IncomingConnectionRequestStatus,
} from "../interfaces/connection-request";
import logger from "../logger";
import { ConnectionRequestRepository } from "../repositories/connection-request-repository";
import ConnectionRequestService from "./connection-request-service";
import ExchangeService from "./exchange-service";
import LambdaService from "./lambda-service";
import NucleusMetadataService from "./nucleus-metadata-service";

export default class AwsConnectionRequestService implements ConnectionRequestService {
  private repository: ConnectionRequestRepository;
  private metadata: NucleusMetadataService;
  private exchangeService: ExchangeService;
  private lambdaService: LambdaService;

  constructor(
    repository: ConnectionRequestRepository,
    metadata: NucleusMetadataService,
    exchangeService: ExchangeService,
    lambdaService: LambdaService,
  ) {
    this.repository = repository;
    this.metadata = metadata;
    this.exchangeService = exchangeService;
    this.lambdaService = lambdaService;
  }

  public async create(connectionRequest: ConnectionRequest) {
    connectionRequest.id = uuid();
    connectionRequest.acceptanceToken = uuid();
    connectionRequest.connection = {
      awsAccountId: readEnv("NUCLEUS_AWS_ACCOUNT_ID"),
      nucleusId: readEnv("NUCLEUS_ID"),
    };
    connectionRequest.verificationCode = generate("0123456789", 6);
    const endpoint = await this.metadata.getEndpoint();
    connectionRequest.consumerEndpoint = endpoint.value;
    connectionRequest.namespace = connectionRequest.namespace || readEnv("NUCLEUS_NAMESPACE");
    connectionRequest.channels = ["XAPI"];
    connectionRequest.status = ConnectionRequestStatus.Created;
    connectionRequest.creationDate = isoDate();
    await this.validateConnectionRequest(connectionRequest);
    await this.repository.put(connectionRequest);
    try {
      this.sendConnectionRequest(connectionRequest);
    } catch {
      // Could not send the request, let's trigger a lambda so it can get into the
      // dead letter queue if it fails again.
      try {
        const lambdaName = await this.metadata.getMetadataValue(LAMBDAS.connectionRequestSend);
        this.lambdaService.invokeApiGatewayLambda(lambdaName, {
          pathParameters: {
            id: connectionRequest.id,
          },
        });
      } catch (e) {
        logger.error(`Problem when sending conn. request ${connectionRequest.id}: ${e.message}`);
      }
    }
    return connectionRequest;
  }

  public async createIncoming(connectionRequest: ConnectionRequest) {
    let alreadySubmitted;
    try {
      await this.repository.getIncoming(connectionRequest.consumerEndpoint, connectionRequest.id);
      alreadySubmitted = true;
    } catch {
      alreadySubmitted = false;
    }
    if (alreadySubmitted) {
      throw new NucleusError("The connection request has already been submitted.");
    }
    connectionRequest.status = ConnectionRequestStatus.Created;
    await this.validateIncomingConnectionRequest(connectionRequest);
    return this.repository.putIncoming(connectionRequest);
  }

  public async sendConnectionRequest(connectionRequest: ConnectionRequest) {
    this.assertConnectionRequestUpdatable(connectionRequest, [ConnectionRequestStatus.Created]);
    await this.exchangeService.sendConnectionRequest(connectionRequest);
    await this.repository.updateStatus(connectionRequest.id, ConnectionRequestStatus.Pending);
  }

  public async receiveProviderRejection(connectionRequest: ConnectionRequest) {
    this.assertConnectionRequestUpdatable(connectionRequest);
    await this.repository.updateStatus(connectionRequest.id, ConnectionRequestStatus.Rejected);
  }

  public async assertConnectionRequestUpdatable(
    connectionRequest: ConnectionRequest,
    pendingStatuses: Array<ConnectionRequestStatus | IncomingConnectionRequestStatus> = [
      ConnectionRequestStatus.Created,
      ConnectionRequestStatus.Pending,
      IncomingConnectionRequestStatus.AcceptedPending,
      IncomingConnectionRequestStatus.RejectedPending,
    ],
  ) {
    return new Promise<void>((resolve, reject) => {
      if (!pendingStatuses.includes(connectionRequest.status)) {
        reject(new NucleusError("The connection request cannot be updated.", 400));
      } else {
        resolve();
      }
    });
  }

  private async validateConnectionRequest(connectionRequest: ConnectionRequest) {
    const ownEndpoint = await this.metadata.getEndpoint();
    if (connectionRequest.providerEndpoint === ownEndpoint.value) {
      throw new NucleusError("An instance cannot create an stream to itself.", 400);
    }
  }

  private async validateIncomingConnectionRequest(connectionRequest: ConnectionRequest) {
    const ownEndpoint = await this.metadata.getEndpoint();
    if (connectionRequest.consumerEndpoint === ownEndpoint.value) {
      throw new NucleusError("An instance cannot create an stream to itself.", 400);
    }
  }
}
