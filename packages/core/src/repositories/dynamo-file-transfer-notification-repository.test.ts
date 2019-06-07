import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { buildFileTransferNotification } from "../../test-support/factories";
import { fakeAws, fakeImpl } from "../../test-support/jest-helper";
import { TABLES } from "../interfaces/aws-metadata-keys";
import { FileTransferNotification } from "../interfaces/file-transfer-notification";
import NucleusMetadataService from "../services/nucleus-metadata-service";
import DynamoFileTransferNotificationRepository from "./dynamo-file-transfer-notification-repository";

const nucleusMetadataService = fakeImpl<NucleusMetadataService>({
  getMetadataValue: jest.fn((key: string) =>
    Promise.resolve({
      value: ({
        [TABLES.nucleusFileTransferNotifications]: "NucleusFileTransferNotifications",
      } as any)[key],
    }),
  ),
});

const documentClient = fakeAws<DocumentClient>({
  delete: jest.fn(),
  put: jest.fn(),
  scan: jest.fn(),
});

describe("DynamoFileTransferNotificationRepository", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("findAll", () => {
    it("finds all file transfer notifications sorted by creation date", async () => {
      const notificationsRepository = new DynamoFileTransferNotificationRepository(
        nucleusMetadataService,
        documentClient,
      );

      documentClient.impl.scan!.mockResolvedValue({
        Items: [
          buildFileTransferNotification(),
          buildFileTransferNotification({
            creationDate: "2019-07-05T22:00:00.000Z",
            id: "dded0fbe-6abe-4c7f-8a55-b1543b7405e9",
            subject: "This is another test message",
          }),
        ],
      });

      const notifications = await notificationsRepository.findAll();
      expect(notifications[0]).toHaveProperty("creationDate", "2019-07-05T22:00:00.000Z");
      expect(notifications[0]).toHaveProperty("id", "dded0fbe-6abe-4c7f-8a55-b1543b7405e9");
      expect(notifications[0]).toHaveProperty("subject", "This is another test message");
      expect(notifications[1]).toHaveProperty("creationDate", "2019-06-04T13:38:39.537Z");
      expect(notifications[1]).toHaveProperty("id", "4f331ac9-5d41-4129-ad1b-b704adc80ce2");
      expect(notifications[1]).toHaveProperty("subject", "This is a test message");
      expect(documentClient.impl.scan!).toHaveBeenCalledWith({
        TableName: "NucleusFileTransferNotifications",
      });
    });

    it("returns an empty array when nothing is found", async () => {
      const notificationsRepository = new DynamoFileTransferNotificationRepository(
        nucleusMetadataService,
        documentClient,
      );
      documentClient.impl.scan!.mockResolvedValue({ Items: [] });

      const notifications = await notificationsRepository.findAll();

      expect(notifications).toEqual([]);
    });
  });

  describe("put", () => {
    it("adds a new file transfer notification", async () => {
      const notificationRepository = new DynamoFileTransferNotificationRepository(
        nucleusMetadataService,
        documentClient,
      );
      const notification = buildFileTransferNotification();

      await notificationRepository.put(notification as FileTransferNotification);
      const item = documentClient.impl.put!.mock.calls[0][0].Item;

      expect(item).toEqual(notification);
      expect(documentClient.impl.put!).toHaveBeenCalledWith({
        Item: notification,
        TableName: "NucleusFileTransferNotifications",
      });
    });
  });

  describe("delete", () => {
    it("deletes a file transfer notification by id", async () => {
      const notificationRepository = new DynamoFileTransferNotificationRepository(
        nucleusMetadataService,
        documentClient,
      );
      await notificationRepository.delete("4f331ac9-5d41-4129-ad1b-b704adc80ce2");

      expect(documentClient.impl.delete!).toHaveBeenCalledWith({
        Key: {
          id: "4f331ac9-5d41-4129-ad1b-b704adc80ce2",
        },
        TableName: "NucleusFileTransferNotifications",
      });
    });
  });
});
