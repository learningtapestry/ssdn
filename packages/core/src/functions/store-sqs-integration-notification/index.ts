import { SNSEventRecord, SNSHandler } from "aws-lambda";
import uuid from "uuid/v4";

import { SQSIntegrationNotification } from "../../interfaces/sqs-integration-notification";
import logger from "../../logger";
import { getSQSIntegrationNotificationRepository } from "../../services";

export const handler: SNSHandler = async (event, context, callback) => {
  try {
    const notifications = await Promise.all(
      event.Records.map(async (record) => {
        return await getSQSIntegrationNotificationRepository().put(buildNotification(record));
      }),
    );

    logger.info(`Stored notifications for ${notifications.length} records.`);

    callback(null, notifications as any);
  } catch (error) {
    logger.error(error);
  }
};

function buildNotification(event: SNSEventRecord): SQSIntegrationNotification {
  const snsInfo = event.Sns;
  const attributes = snsInfo.MessageAttributes;

  return {
    creationDate: snsInfo.Timestamp,
    details: attributes.Details && attributes.Details.Value,
    id: uuid(),
    message: snsInfo.Message,
    queue: attributes.Queue && attributes.Queue.Value,
    subject: snsInfo.Subject,
  };
}
