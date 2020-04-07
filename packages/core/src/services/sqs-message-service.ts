/**
 * sqs-message-service.ts: Receives a message from an SQS queue to be stored into the repository.
 */

import SNS from "aws-sdk/clients/sns";
import last from "lodash/fp/last";

import { TOPICS } from "../interfaces/aws-metadata-keys";
import Event from "../interfaces/event";
import { SNSSQSIntegrationNotification } from "../interfaces/sqs-integration-notification";
import logger from "../logger";
import { EventRepository } from "../repositories/event-repository";
import SSDNMetadataService from "./ssdn-metadata-service";

export default class SQSMessageService {
  private static buildMessageAttributes(notification: SNSSQSIntegrationNotification) {
    return {
      Details: {
        DataType: "String",
        StringValue: notification.details,
      },
      Queue: {
        DataType: "String",
        StringValue: notification.queue,
      },
    };
  }
  constructor(private metadata: SSDNMetadataService, private snsClient: SNS) {}

  public async process(event: Event, repository: EventRepository) {
    try {
      logger.debug("Processing event: %j", event);

      const record = await repository.store(event);

      logger.info("Event has been processed, returning Kinesis record: %j", record);
    } catch (error) {
      logger.error("Unexpected error while processing: %j", error.stack);

      await this.sendNotification({
        details: error.stack,
        message: error.message,
        queue: event.event.origin,
        subject: `Error detected in queue '${last(event.event.origin.split(":"))}'`,
      });

      return {
        errors: [error.message],
        message: "There was an unexpected error while processing the event",
      };
    }
  }

  public async sendNotification(notification: SNSSQSIntegrationNotification) {
    logger.info("Sending SQS integration notification: %j", notification);

    const notificationsTopic = await this.metadata.getMetadataValue(
      TOPICS.sqsIntegrationNotifications,
    );
    const params: SNS.PublishInput = {
      Message: notification.message,
      MessageAttributes: SQSMessageService.buildMessageAttributes(notification),
      Subject: notification.subject,
      TopicArn: notificationsTopic.value,
    };

    await this.snsClient.publish(params).promise();
  }
}
