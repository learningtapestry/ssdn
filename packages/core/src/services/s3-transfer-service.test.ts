import S3 from "aws-sdk/clients/s3";
import SNS from "aws-sdk/clients/sns";
import { TemporaryCredentials } from "aws-sdk/lib/core";

import {
  buildConnection,
  buildEvent,
  buildSNSFileTransferNotification,
} from "../../test-support/factories";
import { fakeAws, fakeImpl, mocked } from "../../test-support/jest-helper";
import { BUCKETS, TOPICS } from "../interfaces/aws-metadata-keys";
import S3TransferService from "./s3-transfer-service";
import SSDNMetadataService from "./ssdn-metadata-service";
import TemporaryCredentialsFactory from "./temporary-credentials-factory";

const fakeMetadata = fakeImpl<SSDNMetadataService>({
  getMetadataValue: jest.fn((key: string) =>
    Promise.resolve({
      value: ({
        [BUCKETS.download]: "RedBucket",
        [TOPICS.fileTransferNotifications]: "NotificationsTopic",
      } as any)[key],
    }),
  ),
});

const fakeTempCredentials = ({
  accessKeyId: "1234",
  getPromise: jest.fn(),
  secretAccessKey: "1234",
  sessionToken: "1234",
} as unknown) as TemporaryCredentials;

const fakeTempCredentialsFactory = fakeImpl<TemporaryCredentialsFactory>({
  getCredentials: jest.fn(() => Promise.resolve(fakeTempCredentials)),
});

const fakeS3 = fakeAws<S3>({
  getObject: jest.fn(),
  putObject: jest.fn(),
});

const fakeSNS = fakeAws<SNS>({ publish: jest.fn() });

const fakeS3Factory = jest.fn(() => fakeS3);

const service = new S3TransferService(
  fakeMetadata,
  fakeS3Factory,
  fakeTempCredentialsFactory,
  fakeSNS,
);

describe("S3TransferService", () => {
  describe("transferObject", () => {
    it("fetches an object from another instance", async () => {
      const connection = buildConnection({
        endpoint: "https://blue.com",
        externalConnection: { arn: "BlueRedArn", externalId: "BlueRedExternalId" },
        metadata: {
          EventProcessorStream: "BlueStream",
          UploadS3Bucket: "BlueBucket",
        },
      });
      const event = buildEvent({
        content: { key: "red.com/Caliper/test+%28file%29.csv" },
      });
      mocked((fakeS3.getObject as any).impl).mockResolvedValueOnce({
        Body: "TestBody",
        Metadata: {
          test: "value",
        },
      });

      await service.transferObject(connection, event);
      expect(fakeTempCredentialsFactory.getCredentials).toHaveBeenCalledWith(
        "BlueRedArn",
        "BlueRedExternalId",
      );
      expect(fakeS3Factory).toHaveBeenCalledWith({ credentials: fakeTempCredentials });
      expect(fakeS3.getObject).toHaveBeenCalledWith({
        Bucket: "BlueBucket",
        Key: "red.com/Caliper/test (file).csv",
      });
      expect(fakeS3.putObject).toHaveBeenCalledWith({
        Body: "TestBody",
        Bucket: "RedBucket",
        Key: "blue.com/red.com/Caliper/test (file).csv",
        Metadata: {
          test: "value",
        },
      });
    });
  });

  describe("sendNotification", () => {
    it("sends an SNS notification to the topic", async () => {
      await service.sendNotification(buildSNSFileTransferNotification());

      expect(fakeSNS.publish).toHaveBeenCalledWith({
        Message: "This is a test message for the file transfer notification topic",
        MessageAttributes: {
          Bucket: { DataType: "String", StringValue: "example-bucket" },
          Details: {
            DataType: "String",
            StringValue:
              "aws-service.ts:295 Uncaught (in promise) Error: An unexpected error occurred: " +
              "Network Error at _callee36$ (aws-service.ts:295)",
          },
          File: {
            DataType: "String",
            StringValue: "ssdn-test.learningtapestry.com/xAPI/test.txt",
          },
          Type: { DataType: "String", StringValue: "error" },
        },
        Subject: "This is a test message",
        TopicArn: "NotificationsTopic",
      });
    });
  });
});
