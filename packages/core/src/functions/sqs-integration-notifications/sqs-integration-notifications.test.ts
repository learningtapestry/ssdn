import { buildSQSIntegrationNotification } from "../../../test-support/factories";
import { FakeImpl } from "../../../test-support/jest-helper";
import { SQSIntegrationNotification } from "../../interfaces/sqs-integration-notification";
import NotificationRepository from "../../repositories/notification-repository";
import { getSQSIntegrationNotificationRepository } from "../../services";
import { handler } from "./index";

jest.mock("../../services", () => {
  const sqsIntegrationNotificationRepo = {
    delete: jest.fn(),
    findAll: jest.fn(),
  };
  const exports = {
    getSQSIntegrationNotificationRepository: jest.fn(() => sqsIntegrationNotificationRepo),
  };

  (exports.getSQSIntegrationNotificationRepository as any).impl = sqsIntegrationNotificationRepo;

  return exports;
});

const repository = (getSQSIntegrationNotificationRepository as any).impl as FakeImpl<
  NotificationRepository<SQSIntegrationNotification>
>;

describe("SQSIntegrationNotificationsApiFunction", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("get", () => {
    it("returns a list of SQS integration notifications", async () => {
      const notification = buildSQSIntegrationNotification();
      repository.findAll!.mockResolvedValue([notification]);

      const response = await handler(
        {
          httpMethod: "GET",
          path: "/sqs-integration/notifications",
        },
        {},
      );

      expect(response.body).toEqual(JSON.stringify([notification]));
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe("delete /:id", () => {
    it("deletes an SQS integration notification by id", async () => {
      const response = await handler(
        {
          httpMethod: "DELETE",
          path: "/sqs-integration/notifications/6e6e94dd-aa5e-47bb-a2df-7f21cafed71e",
        },
        {},
      );

      expect(response.statusCode).toEqual(200);
      expect(repository.delete).toHaveBeenCalledWith("6e6e94dd-aa5e-47bb-a2df-7f21cafed71e");
    });
  });
});
