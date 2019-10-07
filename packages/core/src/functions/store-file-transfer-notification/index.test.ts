import { Context, SNSEvent } from "aws-lambda";

import { buildFileTransferNotification } from "../../../test-support/factories";
import { fakeImpl, mocked } from "../../../test-support/jest-helper";
import storeNotificationEvent from "../../../test-support/lambda-events/store-file-transfer-notification-event.json";
import { FileTransferNotification } from "../../interfaces/file-transfer-notification";
import NotificationRepository from "../../repositories/notification-repository";
import { getFileTransferNotificationRepository } from "../../services";
import { handler } from "./index";

jest.mock("../../services");

describe("StoreFileTransferNotificationFunction", () => {
  const notification = buildFileTransferNotification();
  const fileTransferNotificationRepository = fakeImpl<
    NotificationRepository<FileTransferNotification>
  >({
    put: jest.fn().mockResolvedValue(notification),
  });
  mocked(getFileTransferNotificationRepository).mockReturnValue(fileTransferNotificationRepository);

  it("stores the notification in the repository", async () => {
    await handler(storeNotificationEvent as SNSEvent, {} as Context, (error, result) => {
      expect(result).toEqual([notification]);
    });
  });

  describe("Multiple Upload Events", () => {
    const multiStoreNotificationEvent = {
      Records: [storeNotificationEvent.Records[0], storeNotificationEvent.Records[0]],
    };

    it("returns combined results for all upload events", async () => {
      const anotherNotification = buildFileTransferNotification({
        creationDate: new Date(2019, 6, 6).toISOString(),
        id: "dded0fbe-6abe-4c7f-8a55-b1543b7405e9",
        subject: "This is another test message",
      });

      fileTransferNotificationRepository.put = jest
        .fn()
        .mockReturnValueOnce(notification)
        .mockReturnValueOnce(anotherNotification);

      await handler(multiStoreNotificationEvent as SNSEvent, {} as Context, (error, result) => {
        expect(result).toEqual([notification, anotherNotification]);
      });
    });
  });
});
