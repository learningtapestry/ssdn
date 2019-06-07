/**
 * dynamo-file-transfer-notification-repository.ts: Repository class to manage access to DynamoDB
 * table that stores file transfer notifications
 */

import { DocumentClient } from "aws-sdk/clients/dynamodb";
import orderBy from "lodash/fp/orderBy";
import { TABLES } from "../interfaces/aws-metadata-keys";
import { FileTransferNotification } from "../interfaces/file-transfer-notification";
import logger from "../logger";
import NucleusMetadataService from "../services/nucleus-metadata-service";
import FileTransferNotificationRepository from "./file-transfer-notification-repository";

export default class DynamoFileTransferNotificationRepository
  implements FileTransferNotificationRepository {
  constructor(private metadata: NucleusMetadataService, private client: DocumentClient) {}

  public async findAll(): Promise<FileTransferNotification[]> {
    const items = await this.client.scan({ TableName: await this.getTableName() }).promise();

    if (!items || !items.Items) {
      return [];
    }

    return orderBy<FileTransferNotification>((notification) => new Date(notification.creationDate))(
      ["desc"],
    )(items.Items as FileTransferNotification[]);
  }

  public async put(
    fileTransferNotification: FileTransferNotification,
  ): Promise<FileTransferNotification> {
    logger.info("Storing file transfer notification: %j", fileTransferNotification);

    await this.client
      .put({
        Item: fileTransferNotification,
        TableName: await this.getTableName(),
      })
      .promise();

    return fileTransferNotification;
  }

  public async delete(id: string): Promise<void> {
    logger.info("Deleting notification with id: %s", id);

    await this.client
      .delete({
        Key: { id },
        TableName: await this.getTableName(),
      })
      .promise();
  }

  private async getTableName() {
    const name = await this.metadata.getMetadataValue(TABLES.nucleusFileTransferNotifications);

    return name.value;
  }
}
