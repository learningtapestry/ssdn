import S3 from "aws-sdk/clients/s3";
import SNS from "aws-sdk/clients/sns";
import { parse } from "url";

import { BUCKETS, TOPICS } from "../interfaces/aws-metadata-keys";
import { Factory } from "../interfaces/base-types";
import { Connection } from "../interfaces/connection";
import Event from "../interfaces/event";
import {
  FileTransferNotificationType,
  SNSFileTransferNotification,
} from "../interfaces/file-transfer-notification";
import logger from "../logger";
import NucleusMetadataService from "./nucleus-metadata-service";
import TemporaryCredentialsFactory from "./temporary-credentials-factory";

export default class S3TransferService {
  constructor(
    private metadata: NucleusMetadataService,
    private readonly s3ClientFactory: Factory<S3>,
    private tempCredentialsFactory: TemporaryCredentialsFactory,
    private snsClient: SNS,
  ) {}

  public async transferObject(connection: Connection, event: Event) {
    const externalS3 = this.s3ClientFactory({
      credentials: await this.tempCredentialsFactory.getCredentials(
        connection.externalConnection.arn,
        connection.externalConnection.externalId,
      ),
    });

    logger.info(`Fetching object ${event.content.key} from external upload bucket.`);
    try {
      const object = await externalS3
        .getObject({
          Bucket: connection.metadata.UploadS3Bucket,
          Key: event.content.key,
        })
        .promise();

      const internalS3 = this.s3ClientFactory();
      const downloadBucket = await this.metadata.getMetadataValue(BUCKETS.download);
      const endpointHostname = parse(connection.endpoint).hostname;

      logger.info(`Storing object ${event.content.key} into download bucket.`);
      await internalS3
        .putObject({
          Body: object.Body,
          Bucket: downloadBucket.value,
          Key: `${endpointHostname}/${event.content.key}`,
          Metadata: object.Metadata,
        })
        .promise();

      await this.sendNotification({
        bucket: downloadBucket.value,
        file: event.content.key,
        message: "File has been successfully transferred to the download bucket",
        subject: "Transfer success",
        type: FileTransferNotificationType.Info,
      });
    } catch (error) {
      const errorDetails = error.trace
        ? error.trace()
        : error.message
        ? error.message
        : "Unexpected error";

      await this.sendNotification({
        bucket: connection.metadata.UploadS3Bucket,
        details: errorDetails,
        file: event.content.key,
        message: "There was a problem transferring the file",
        subject: error.message,
        type: FileTransferNotificationType.Error,
      });
      throw error;
    }
  }

  public async sendNotification(notification: SNSFileTransferNotification) {
    logger.info("Sending file transfer notification: %j", notification);

    const notificationsTopic = await this.metadata.getMetadataValue(
      TOPICS.fileTransferNotifications,
    );
    const params: SNS.PublishInput = {
      Message: notification.message,
      MessageAttributes: this.buildMessageAttributes(notification),
      Subject: notification.subject,
      TopicArn: notificationsTopic.value,
    };

    await this.snsClient.publish(params).promise();
  }

  private buildMessageAttributes(notification: SNSFileTransferNotification) {
    const attributes: SNS.MessageAttributeMap = {
      Bucket: {
        DataType: "String",
        StringValue: notification.bucket,
      },
      File: {
        DataType: "String",
        StringValue: notification.file,
      },
      Type: {
        DataType: "String",
        StringValue: notification.type,
      },
    };

    if (notification.details) {
      attributes.Details = {
        DataType: "String",
        StringValue: notification.details,
      };
    }

    return attributes;
  }
}
