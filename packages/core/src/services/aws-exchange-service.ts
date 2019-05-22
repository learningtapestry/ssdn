import Kinesis from "aws-sdk/clients/kinesis";
import { sign } from "aws4";
import Axios from "axios";
import { RequestOptions } from "https";
import { parse } from "url";

import { NucleusError } from "../errors/nucleus-error";
import { AWS_NUCLEUS } from "../interfaces/aws-metadata-keys";
import {
  Connection,
  ConsumerIssuedConnection,
  ExternalConnectionDetails,
} from "../interfaces/connection";
import { ConnectionRequest } from "../interfaces/connection-request";
import Event from "../interfaces/event";
import { ProviderIssuedAcceptance, StreamUpdate } from "../interfaces/exchange";
import logger from "../logger";
import KinesisEventRepository from "../repositories/kinesis-event-repository";
import ExchangeService from "./exchange-service";
import ExternalNucleusMetadataService from "./external-nucleus-metadata-service";
import NucleusMetadataService from "./nucleus-metadata-service";
import TemporaryCredentialsFactory from "./temporary-credentials-factory";

type SignedRequestOptions = RequestOptions & {
  body: string;
  data: any;
  url: string;
};

export const connectionRequestVerifyPath = (endpoint: string, id: string) =>
  `${endpoint}/connections/requests/${id}/verify`;

export const connectionRequestsAcceptPath = (endpoint: string, id: string) =>
  `${endpoint}/connections/requests/${id}/accept`;

export const incomingRequestsPath = (endpoint: string) =>
  `${endpoint}/connections/incoming-requests`;

export const streamsPath = (endpoint: string) => `${endpoint}/connections/streams/update`;

type ExternalRepoFactory = (
  p1: ConstructorParameters<typeof ExternalNucleusMetadataService>,
  p2: ConstructorParameters<typeof Kinesis>,
) => KinesisEventRepository;

export default class AwsExchangeService implements ExchangeService {
  private metadata: NucleusMetadataService;
  private temporaryCredentialsFactory: TemporaryCredentialsFactory;
  private kinesisEventRepoFactory: ExternalRepoFactory;

  constructor(
    metadata: NucleusMetadataService,
    temporaryCredentialsFactory: TemporaryCredentialsFactory,
    kinesisEventRepoFactory: ExternalRepoFactory,
  ) {
    this.metadata = metadata;
    this.temporaryCredentialsFactory = temporaryCredentialsFactory;
    this.kinesisEventRepoFactory = kinesisEventRepoFactory;
  }

  public async sendAcceptance(
    connectionRequest: ConnectionRequest,
    providerAcceptance: ProviderIssuedAcceptance,
  ) {
    const response = await Axios.post(
      connectionRequestsAcceptPath(connectionRequest.consumerEndpoint, connectionRequest.id),
      providerAcceptance,
      {
        headers: {
          Authorization: `Bearer ${connectionRequest.acceptanceToken}`,
        },
      },
    );

    return response.data as ConsumerIssuedConnection;
  }

  public async sendConnectionRequest(connectionRequest: ConnectionRequest) {
    const submitUrl = incomingRequestsPath(connectionRequest.providerEndpoint);
    await Axios.post(submitUrl, connectionRequest);
  }

  public async sendEvents(connection: Connection, events: Event[]) {
    logger.info(`Sending events to ${connection.endpoint}`);
    const { arn, externalId } = connection.externalConnection;
    const credentials = await this.temporaryCredentialsFactory.getCredentials(arn, externalId);
    const externalRepository = this.kinesisEventRepoFactory([connection], [{ credentials }]);
    const nucleusId = await this.metadata.getMetadataValue(AWS_NUCLEUS.nucleusId);
    const annotatedEvents: Event[] = events.map((evt) => ({
      ...evt,
      source: {
        nucleusId: nucleusId.value,
      },
    }));
    await externalRepository.storeBatch(annotatedEvents);
    logger.info(`Wrote to ${connection.endpoint}'s stream.`);
  }

  public async sendRejection(connectionRequest: ConnectionRequest) {
    await Axios.post(
      connectionRequestsAcceptPath(connectionRequest.consumerEndpoint, connectionRequest.id),
      {
        accepted: false,
      },
      {
        headers: {
          Authorization: `Bearer ${connectionRequest.acceptanceToken}`,
        },
      },
    );
  }

  public async sendStreamUpdate(connection: Connection, streamUpdate: StreamUpdate) {
    await this.signedRequest(
      {
        arn: connection.externalConnection.arn,
        externalId: connection.externalConnection.externalId,
      },
      "POST",
      streamsPath(connection.endpoint),
      streamUpdate,
    );
  }

  public async verifyConnectionRequest(connectionRequest: ConnectionRequest) {
    try {
      await Axios.get(
        connectionRequestVerifyPath(connectionRequest.consumerEndpoint, connectionRequest.id),
        {
          headers: {
            Authorization: `Bearer ${connectionRequest.acceptanceToken}`,
          },
        },
      );
      return;
    } catch {
      throw new NucleusError("We could not verify the request with the consumer endpoint.", 422);
    }
  }

  private async signedRequest(
    connectionDetails: ExternalConnectionDetails,
    method: string,
    url: string,
    data: any = "",
    additionalOptions: SignedRequestOptions | {} = {},
  ) {
    let payload = data;
    if (data && typeof data !== "string") {
      payload = JSON.stringify(data);
    }
    const parsedUrl = parse(url);
    const request: SignedRequestOptions = {
      body: payload,
      data,
      headers: {
        "Content-Type": "application/json",
      },
      host: parsedUrl.host,
      method,
      path: parsedUrl.pathname,
      url,
      ...additionalOptions,
    };
    const credentials = await this.temporaryCredentialsFactory.getCredentials(
      connectionDetails.arn,
      connectionDetails.externalId,
    );
    await credentials.getPromise();
    const signedRequest = sign(request, {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    });
    delete signedRequest.headers.Host;
    delete signedRequest.headers["Content-Length"];
    return Axios.request(signedRequest);
  }
}
