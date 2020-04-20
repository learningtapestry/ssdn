import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { SSDNError } from "../errors/ssdn-error";
import { isoDate } from "../helpers/app-helper";
import { getOrFail } from "../helpers/dynamo-helper";
import { URL_REGEX } from "../helpers/url-regex";
import { TABLES } from "../interfaces/aws-metadata-keys";
import {
  ConnectionRequest,
  ConnectionRequestStatus,
  IncomingConnectionRequestStatus,
} from "../interfaces/connection-request";
import SSDNMetadataService from "../services/ssdn-metadata-service";
import { ConnectionRequestRepository } from "./connection-request-repository";

export default class DynamoConnectionRequestRepository implements ConnectionRequestRepository {
  private metadata: SSDNMetadataService;
  private client: DocumentClient;

  constructor(metadata: SSDNMetadataService, client: DocumentClient) {
    this.metadata = metadata;
    this.client = client;
  }

  public async get(id: string) {
    return getOrFail<ConnectionRequest>(this.client, { id }, await this.getTableName());
  }

  public async getIncoming(consumerEndpoint: string, id: string) {
    return getOrFail<ConnectionRequest>(
      this.client,
      { consumerEndpoint, id },
      await this.getIncomingTableName(),
    );
  }

  public async updateStatus(id: string, status: ConnectionRequestStatus) {
    await this.client
      .update({
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": status,
        },
        Key: {
          id,
        },
        TableName: await this.getTableName(),
        UpdateExpression: "SET #status = :status",
      })
      .promise();
    return this.get(id);
  }

  public async updateIncomingStatus(
    consumerEndpoint: string,
    id: string,
    status: ConnectionRequestStatus | IncomingConnectionRequestStatus,
  ) {
    await this.client
      .update({
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": status,
        },
        Key: {
          consumerEndpoint,
          id,
        },
        TableName: await this.getIncomingTableName(),
        UpdateExpression: "SET #status = :status",
      })
      .promise();
    return this.getIncoming(consumerEndpoint, id);
  }

  public async put(connectionRequest: ConnectionRequest) {
    connectionRequest = {
      ...connectionRequest,
      creationDate: connectionRequest.creationDate || isoDate(),
    };

    if (
      !URL_REGEX.test(connectionRequest.providerEndpoint) ||
      !URL_REGEX.test(connectionRequest.consumerEndpoint)
    ) {
      throw new SSDNError("The endpoint for the connection is not valid.", 400);
    }

    await this.client
      .put({
        Item: connectionRequest,
        TableName: await this.getTableName(),
      })
      .promise();
    return connectionRequest;
  }

  public async putIncoming(connectionRequest: ConnectionRequest) {
    connectionRequest = {
      ...connectionRequest,
      creationDate: connectionRequest.creationDate || isoDate(),
    };

    if (
      !URL_REGEX.test(connectionRequest.providerEndpoint) ||
      !URL_REGEX.test(connectionRequest.consumerEndpoint)
    ) {
      throw new SSDNError("The endpoint for the connection is not valid.", 400);
    }

    await this.client
      .put({
        Item: connectionRequest,
        TableName: await this.getIncomingTableName(),
      })
      .promise();
    return connectionRequest;
  }

  private async getTableName() {
    const name = await this.metadata.getMetadataValue(TABLES.ssdnConnectionRequests);
    return name.value;
  }

  private async getIncomingTableName() {
    const name = await this.metadata.getMetadataValue(TABLES.ssdnIncomingConnectionRequests);
    return name.value;
  }
}
