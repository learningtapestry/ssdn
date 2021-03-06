import { DocumentClient } from "aws-sdk/clients/dynamodb";
import sortBy from "lodash/fp/sortBy";

import { isoDate } from "../helpers/app-helper";
import { getOrFail } from "../helpers/dynamo-helper";
import { TABLES } from "../interfaces/aws-metadata-keys";
import { Format } from "../interfaces/format";
import SSDNMetadataService from "../services/ssdn-metadata-service";
import FormatRepository from "./format-repository";

export default class DynamoFormatRepository implements FormatRepository {
  private metadata: SSDNMetadataService;
  private client: DocumentClient;

  constructor(metadata: SSDNMetadataService, client: DocumentClient) {
    this.metadata = metadata;
    this.client = client;
  }

  public async get(name: string): Promise<Format> {
    return getOrFail<Format>(this.client, { name }, await this.getTableName());
  }

  public async findAll(): Promise<Format[]> {
    const items = await this.client.scan({ TableName: await this.getTableName() }).promise();

    if (!items || !items.Items) {
      return [];
    }

    return sortBy((format) => format.name, items.Items as Format[]);
  }

  public async update(name: string, format: Format): Promise<Format> {
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

  public async put(format: Format): Promise<Format> {
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
    const name = await this.metadata.getMetadataValue(TABLES.ssdnFormats);
    return name.value;
  }
}
