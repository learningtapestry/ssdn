import { Context, SNSEvent } from "aws-lambda";

import { buildSQSIntegrationNotification } from "../../../test-support/factories";
import { fakeImpl, mocked } from "../../../test-support/jest-helper";
import storeNotificationEvent from "../../../test-support/lambda-events/store-sqs-integration-notification-event.json";
import { SQSIntegrationNotification } from "../../interfaces/sqs-integration-notification";
import NotificationRepository from "../../repositories/notification-repository";
import { getSQSIntegrationNotificationRepository } from "../../services";
import { handler } from "./index";

jest.mock("../../services");

describe("StoreSQSIntegrationNotificationFunction", () => {
  const notification = buildSQSIntegrationNotification();
  const sqsIntegrationNotificationRepository = fakeImpl<
    NotificationRepository<SQSIntegrationNotification>
  >({
    put: jest.fn().mockResolvedValue(notification),
  });
  mocked(getSQSIntegrationNotificationRepository).mockReturnValue(
    sqsIntegrationNotificationRepository,
  );

  it("stores the notification in the repository", async () => {
    await handler(storeNotificationEvent as SNSEvent, {} as Context, (error, result) => {
      expect(result).toEqual([notification]);
    });
  });

  describe("Multiple Notification Events", () => {
    const multiStoreNotificationEvent = {
      Records: [storeNotificationEvent.Records[0], storeNotificationEvent.Records[0]],
    };

    it("returns combined results for all notification events", async () => {
      const anotherNotification = buildSQSIntegrationNotification({
        creationDate: new Date(2019, 6, 6).toISOString(),
        id: "dded0fbe-6abe-4c7f-8a55-b1543b7405e9",
        subject: "This is another test message",
      });

      sqsIntegrationNotificationRepository.put = jest
        .fn()
        .mockReturnValueOnce(notification)
        .mockReturnValueOnce(anotherNotification);

      await handler(multiStoreNotificationEvent as SNSEvent, {} as Context, (error, result) => {
        expect(result).toEqual([notification, anotherNotification]);
      });
    });
  });
});
