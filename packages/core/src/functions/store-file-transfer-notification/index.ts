import { SNSEventRecord, SNSHandler } from "aws-lambda";
import uuid from "uuid/v4";
import {
  FileTransferNotification,
  FileTransferNotificationType,
} from "../../interfaces/file-transfer-notification";
import { getFileTransferNotificationRepository } from "../../services";

export const handler: SNSHandler = async (event, context, callback) => {
  const notifications = await Promise.all(
    event.Records.map(async (record) => {
      return await getFileTransferNotificationRepository().put(buildNotification(record));
    }),
  );

  callback(null, notifications as any);
};

function buildNotification(event: SNSEventRecord): FileTransferNotification {
  const snsInfo = event.Sns;
  const attributes = snsInfo.MessageAttributes;
  return {
    bucket: attributes.Bucket.Value,
    creationDate: snsInfo.Timestamp,
    details: attributes.Details && attributes.Details.Value,
    file: attributes.File.Value,
    id: uuid(),
    message: snsInfo.Message,
    subject: snsInfo.Subject,
    type: attributes.Type.Value as FileTransferNotificationType,
  };
}
