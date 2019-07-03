import generate from "nanoid/generate";
import uuid from "uuid/v4";

import { NucleusError } from "../errors/nucleus-error";
import { isoDate } from "../helpers/app-helper";
import { AWS_NUCLEUS, LAMBDAS } from "../interfaces/aws-metadata-keys";
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
    logger.info(`Processing connection request for ${connectionRequest.providerEndpoint}.`);
    const awsAccountId = await this.metadata.getMetadataValue(AWS_NUCLEUS.awsAccountId);
    const nucleusId = await this.metadata.getMetadataValue(AWS_NUCLEUS.nucleusId);
    const namespace = await this.metadata.getMetadataValue(AWS_NUCLEUS.namespace);
    connectionRequest.id = uuid();
    connectionRequest.acceptanceToken = uuid();
    connectionRequest.connection = {
      awsAccountId: awsAccountId.value,
      nucleusId: nucleusId.value,
    };
    connectionRequest.verificationCode = generate("0123456789", 6);
    const endpoint = await this.metadata.getEndpoint();
    connectionRequest.consumerEndpoint = endpoint.value;
    connectionRequest.namespace = connectionRequest.namespace || namespace.value;
    connectionRequest.status = ConnectionRequestStatus.Created;
    connectionRequest.creationDate = isoDate();

    await this.validateConnectionRequest(connectionRequest);
    await this.repository.put(connectionRequest);
    try {
      await this.sendConnectionRequest(connectionRequest);
      logger.info(`Request has been sent and created.`);
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
    let alreadySubmitted = false;
    try {
      await this.repository.getIncoming(connectionRequest.consumerEndpoint, connectionRequest.id);
      alreadySubmitted = true;
      throw new NucleusError("The connection request has already been submitted.");
    } catch (e) {
      // Otherwise, continue as usual; a connection request has not been found
      if (alreadySubmitted) {
        throw e;
      }
    }
    connectionRequest.status = ConnectionRequestStatus.Created;
    await this.validateIncomingConnectionRequest(connectionRequest);
    const newRequest = await this.repository.putIncoming(connectionRequest);
    logger.info(`Request ${newRequest.consumerEndpoint} - ${newRequest.id} has been received.`);
    return newRequest;
  }

  public async sendConnectionRequest(connectionRequest: ConnectionRequest) {
    await this.assertConnectionRequestUpdatable(connectionRequest, [
      ConnectionRequestStatus.Created,
    ]);
    await this.exchangeService.sendConnectionRequest(connectionRequest);
    await this.repository.updateStatus(connectionRequest.id, ConnectionRequestStatus.Pending);
  }

  public async receiveProviderRejection(connectionRequest: ConnectionRequest) {
    await this.assertConnectionRequestUpdatable(connectionRequest);
    await this.repository.updateStatus(connectionRequest.id, ConnectionRequestStatus.Rejected);
    logger.info(`Request ${connectionRequest.id} status has been updated.`);
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
    if (!pendingStatuses.includes(connectionRequest.status)) {
      throw new NucleusError("The connection request cannot be updated.", 400);
    }
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
