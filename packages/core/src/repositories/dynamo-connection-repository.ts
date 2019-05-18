import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { isoDate } from "../helpers/app-helper";
import { getOrFail } from "../helpers/dynamo-helper";
import { TABLES } from "../interfaces/aws-metadata-keys";
import { Connection } from "../interfaces/connection";
import NucleusMetadataService from "../services/nucleus-metadata-service";
import ConnectionRepository from "./connection-repository";

export default class DynamoConnectionRepository implements ConnectionRepository {
  private metadata: NucleusMetadataService;
  private client: DocumentClient;

  constructor(metadata: NucleusMetadataService, client: DocumentClient) {
    this.metadata = metadata;
    this.client = client;
  }

  public async findAllWithOutputStreams() {
    const items = await this.client
      .scan({
        FilterExpression: `attribute_exists(outputStreams[0])`,
        TableName: await this.getTableName(),
      })
      .promise();

    if (!items.Items) {
      return [];
    }

    return items.Items as Connection[];
  }

  public async get(endpoint: string) {
    return getOrFail<Connection>(this.client, { endpoint }, await this.getTableName());
  }

  public async getByConnectionSecret(roleName: string) {
    const items = await this.client
      .scan({
        ExpressionAttributeNames: {
          "#connection": "connection",
          "#roleName": "roleName",
        },
        ExpressionAttributeValues: {
          ":roleName": roleName,
        },
        FilterExpression: `#connection.#roleName = :roleName`,
        TableName: await this.getTableName(),
      })
      .promise();

    if (!items.Items || items.Items.length !== 1) {
      throw new Error(`Role not found: ${roleName}`);
    }

    return items.Items[0] as Connection;
  }

  public async put(connection: Connection) {
    connection = {
      ...connection,
      creationDate: connection.creationDate || isoDate(),
      updateDate: isoDate(),
    };

    await this.client
      .put({
        Item: connection,
        TableName: await this.getTableName(),
      })
      .promise();

    return connection;
  }

  private async getTableName() {
    const name = await this.metadata.getMetadataValue(TABLES.nucleusConnections);
    return name.value;
  }
}
