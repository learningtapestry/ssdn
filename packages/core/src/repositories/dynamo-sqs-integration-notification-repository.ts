/**
 * dynamo-sqs-integration-notification-repository.ts: Repository class to manage access to
 * DynamoDB table that stores SQS integration notifications
 */

import { DocumentClient } from "aws-sdk/clients/dynamodb";
import orderBy from "lodash/fp/orderBy";

import { TABLES } from "../interfaces/aws-metadata-keys";
import { SQSIntegrationNotification } from "../interfaces/sqs-integration-notification";
import logger from "../logger";
import SSDNMetadataService from "../services/ssdn-metadata-service";
import NotificationRepository from "./notification-repository";

export default class DynamoSQSIntegrationNotificationRepository
  implements NotificationRepository<SQSIntegrationNotification> {
  constructor(private metadata: SSDNMetadataService, private client: DocumentClient) {}

  public async findAll(): Promise<SQSIntegrationNotification[]> {
    const items = await this.client.scan({ TableName: await this.getTableName() }).promise();

    if (!items || !items.Items) {
      return [];
    }

    return orderBy<SQSIntegrationNotification>(
      (notification) => new Date(notification.creationDate),
    )(["desc"])(items.Items as SQSIntegrationNotification[]);
  }

  public async put(
    sqsIntegrationNotification: SQSIntegrationNotification,
  ): Promise<SQSIntegrationNotification> {
    logger.info("Storing SQS integration notification: %j", sqsIntegrationNotification);

    await this.client
      .put({
        Item: sqsIntegrationNotification,
        TableName: await this.getTableName(),
      })
      .promise();

    return sqsIntegrationNotification;
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
    const name = await this.metadata.getMetadataValue(TABLES.ssdnSQSIntegrationNotifications);

    return name.value;
  }
}
