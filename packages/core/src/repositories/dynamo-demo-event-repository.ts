import { DocumentClient } from "aws-sdk/clients/dynamodb";
import uuid from "uuid/v4";
import { getOrFail } from "../helpers/dynamo-helper";
import { TABLES } from "../interfaces/aws-metadata-keys";
import { Connection } from "../interfaces/connection";
import { DemoEvent } from "../interfaces/demo-event";
import NucleusMetadataService from "../services/nucleus-metadata-service";

export default class DynamoDemoEventRepository {
  private metadata: NucleusMetadataService;
  private client: DocumentClient;

  constructor(metadata: NucleusMetadataService, client: DocumentClient) {
    this.metadata = metadata;
    this.client = client;
  }

  public async get(endpoint: string) {
    return getOrFail<Connection>(this.client, { endpoint }, await this.getTableName());
  }

  public async put(demoEvent: DemoEvent) {
    await this.client
      .put({
        Item: { ...demoEvent, id: uuid() },
        TableName: await this.getTableName(),
      })
      .promise();

    return demoEvent;
  }

  private async getTableName() {
    const name = await this.metadata.getMetadataValue(TABLES.nucleusDemoEvents);
    return name.value;
  }
}
