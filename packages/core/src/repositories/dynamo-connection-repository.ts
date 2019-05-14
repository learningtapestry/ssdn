import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { getDocumentClient } from "../aws-clients";
import { getOrFail } from "../helpers/dynamo-helper";
import { Connection } from "../interfaces/connection";
import { TABLES } from "../services/aws-entity-names";
import ConnectionRepository from "./connection-repository";

export default class DynamoConnectionRepository implements ConnectionRepository {
  private client: DocumentClient;

  constructor() {
    this.client = getDocumentClient();
  }

  public async findAllWithOutputStreams() {
    const items = await this.client
      .scan({
        FilterExpression: `attribute_exists(outputStreams[0])`,
        TableName: TABLES.nucleusConnections,
      })
      .promise();

    if (!items.Items) {
      return [];
    }

    return items.Items as Connection[];
  }

  public async get(endpoint: string) {
    return getOrFail<Connection>(this.client, { endpoint }, TABLES.nucleusConnections);
  }

  public async put(connection: Connection) {
    connection = {
      ...connection,
      creationDate: connection.creationDate || new Date().toUTCString(),
      updateDate: new Date().toUTCString(),
    };

    await this.client
      .put({
        Item: connection,
        TableName: TABLES.nucleusConnections,
      })
      .promise();

    return connection;
  }
}
