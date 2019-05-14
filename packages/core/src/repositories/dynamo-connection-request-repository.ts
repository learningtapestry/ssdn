import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { getDocumentClient } from "../aws-clients";
import { getOrFail } from "../helpers/dynamo-helper";
import {
  ConnectionRequest,
  ConnectionRequestStatus,
  IncomingConnectionRequestStatus,
} from "../interfaces/connection-request";
import { TABLES } from "../services/aws-entity-names";
import { ConnectionRequestRepository } from "./connection-request-repository";

export default class DynamoConnectionRequestRepository implements ConnectionRequestRepository {
  private client: DocumentClient;

  constructor() {
    this.client = getDocumentClient();
  }

  public async get(id: string) {
    return getOrFail<ConnectionRequest>(this.client, { id }, TABLES.nucleusConnectionRequests);
  }

  public async getIncoming(consumerEndpoint: string, id: string) {
    return getOrFail<ConnectionRequest>(
      this.client,
      { consumerEndpoint, id },
      TABLES.nucleusIncomingConnectionRequests,
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
        TableName: TABLES.nucleusConnectionRequests,
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
        TableName: TABLES.nucleusIncomingConnectionRequests,
        UpdateExpression: "SET #status = :status",
      })
      .promise();
    return this.getIncoming(consumerEndpoint, id);
  }

  public async put(connectionRequest: ConnectionRequest) {
    connectionRequest = {
      ...connectionRequest,
      creationDate: connectionRequest.creationDate || new Date().toUTCString(),
    };
    await this.client
      .put({
        Item: connectionRequest,
        TableName: TABLES.nucleusConnectionRequests,
      })
      .promise();
    return connectionRequest;
  }

  public async putIncoming(connectionRequest: ConnectionRequest) {
    connectionRequest = {
      ...connectionRequest,
      creationDate: connectionRequest.creationDate || new Date().toUTCString(),
    };
    await this.client
      .put({
        Item: connectionRequest,
        TableName: TABLES.nucleusIncomingConnectionRequests,
      })
      .promise();
    return connectionRequest;
  }
}
