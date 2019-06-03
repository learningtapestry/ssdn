import { DocumentClient } from "aws-sdk/clients/dynamodb";
import sortBy from "lodash/fp/sortBy";

import { isoDate } from "../helpers/app-helper";
import { getOrFail } from "../helpers/dynamo-helper";
import { TABLES } from "../interfaces/aws-metadata-keys";
import { DbFormat } from "../interfaces/format";
import NucleusMetadataService from "../services/nucleus-metadata-service";
import FormatRepository from "./format-repository";

export default class DynamoFormatRepository implements FormatRepository {
  private metadata: NucleusMetadataService;
  private client: DocumentClient;

  constructor(metadata: NucleusMetadataService, client: DocumentClient) {
    this.metadata = metadata;
    this.client = client;
  }

  public async get(name: string): Promise<DbFormat> {
    return getOrFail<DbFormat>(this.client, { name }, await this.getTableName());
  }

  public async findAll(): Promise<DbFormat[]> {
    const items = await this.client.scan({ TableName: await this.getTableName() }).promise();

    if (!items || !items.Items) {
      return [];
    }

    return sortBy((format) => format.name, items.Items as DbFormat[]);
  }

  public async update(name: string, format: DbFormat): Promise<DbFormat> {
    const oldFormat = await this.get(name);
    const newFormat = {
      ...oldFormat,
      ...format,
      creationDate: oldFormat.creationDate,
      name,
      updateDate: isoDate(),
    };

    await this.client
      .put({
        Item: newFormat,
        TableName: await this.getTableName(),
      })
      .promise();

    return newFormat;
  }

  public async put(format: DbFormat): Promise<DbFormat> {
    format = {
      ...format,
      creationDate: format.creationDate || isoDate(),
      updateDate: isoDate(),
    };

    await this.client
      .put({
        Item: format,
        TableName: await this.getTableName(),
      })
      .promise();

    return format;
  }

  public async delete(name: string): Promise<void> {
    const format = await this.get(name);
    await this.client
      .delete({
        Key: {
          name: format.name,
        },
        TableName: await this.getTableName(),
      })
      .promise();
  }

  private async getTableName() {
    const name = await this.metadata.getMetadataValue(TABLES.nucleusFormats);
    return name.value;
  }
}
