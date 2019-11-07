import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { buildSQSIntegrationNotification } from "../../test-support/factories";
import { fakeAws, fakeImpl } from "../../test-support/jest-helper";
import { TABLES } from "../interfaces/aws-metadata-keys";
import { SQSIntegrationNotification } from "../interfaces/sqs-integration-notification";
import SSDNMetadataService from "../services/ssdn-metadata-service";
import DynamoSQSIntegrationNotificationRepository from "./dynamo-sqs-integration-notification-repository";

const ssdnMetadataService = fakeImpl<SSDNMetadataService>({
  getMetadataValue: jest.fn((key: string) =>
    Promise.resolve({
      value: ({
        [TABLES.ssdnSQSIntegrationNotifications]: "SSDNSQSIntegrationNotifications",
      } as any)[key],
    }),
  ),
});

const documentClient = fakeAws<DocumentClient>({
  delete: jest.fn(),
  put: jest.fn(),
  scan: jest.fn(),
});

describe("DynamoSQSIntegrationNotificationRepository", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("findAll", () => {
    it("finds all queue integration notifications sorted by creation date", async () => {
      const notificationsRepository = new DynamoSQSIntegrationNotificationRepository(
        ssdnMetadataService,
        documentClient,
      );

      documentClient.impl.scan!.mockResolvedValue({
        Items: [
          buildSQSIntegrationNotification(),
          buildSQSIntegrationNotification({
            creationDate: "2019-07-05T22:00:00.000Z",
            id: "dded0fbe-6abe-4c7f-8a55-b1543b7405e9",
            message: "Another Test SQS error",
          }),
        ],
      });

      const notifications = await notificationsRepository.findAll();
      expect(notifications[0]).toHaveProperty("creationDate", "2019-10-07T11:52:37.616Z");
      expect(notifications[0]).toHaveProperty("id", "d887cd79-010b-4572-9121-5821b9ec5390");
      expect(notifications[0]).toHaveProperty("message", "Test SQS error");
      expect(notifications[1]).toHaveProperty("creationDate", "2019-07-05T22:00:00.000Z");
      expect(notifications[1]).toHaveProperty("id", "dded0fbe-6abe-4c7f-8a55-b1543b7405e9");
      expect(notifications[1]).toHaveProperty("message", "Another Test SQS error");
      expect(documentClient.impl.scan!).toHaveBeenCalledWith({
        TableName: "SSDNSQSIntegrationNotifications",
      });
    });

    it("returns an empty array when nothing is found", async () => {
      const notificationsRepository = new DynamoSQSIntegrationNotificationRepository(
        ssdnMetadataService,
        documentClient,
      );
      documentClient.impl.scan!.mockResolvedValue({ Items: [] });

      const notifications = await notificationsRepository.findAll();

      expect(notifications).toEqual([]);
    });
  });

  describe("put", () => {
    it("adds a new queue integration notification", async () => {
      const notificationRepository = new DynamoSQSIntegrationNotificationRepository(
        ssdnMetadataService,
        documentClient,
      );
      const notification = buildSQSIntegrationNotification();

      await notificationRepository.put(notification as SQSIntegrationNotification);
      const item = documentClient.impl.put!.mock.calls[0][0].Item;

      expect(item).toEqual(notification);
      expect(documentClient.impl.put!).toHaveBeenCalledWith({
        Item: notification,
        TableName: "SSDNSQSIntegrationNotifications",
      });
    });
  });

  describe("delete", () => {
    it("deletes a queue integration notification by id", async () => {
      const notificationRepository = new DynamoSQSIntegrationNotificationRepository(
        ssdnMetadataService,
        documentClient,
      );
      await notificationRepository.delete("4f331ac9-5d41-4129-ad1b-b704adc80ce2");

      expect(documentClient.impl.delete!).toHaveBeenCalledWith({
        Key: {
          id: "4f331ac9-5d41-4129-ad1b-b704adc80ce2",
        },
        TableName: "SSDNSQSIntegrationNotifications",
      });
    });
  });
});
