import { buildFileTransferNotification } from "../../../test-support/factories";
import { FakeImpl } from "../../../test-support/jest-helper";
import FileTransferNotificationRepository from "../../repositories/file-transfer-notification-repository";
import { getFileTransferNotificationRepository } from "../../services";
import { handler } from "./index";

jest.mock("../../services", () => {
  const fileTransferNotificationRepository = {
    delete: jest.fn(),
    findAll: jest.fn(),
  };
  const exports = {
    getFileTransferNotificationRepository: jest.fn(() => fileTransferNotificationRepository),
  };

  (exports.getFileTransferNotificationRepository as any).impl = fileTransferNotificationRepository;

  return exports;
});

const repository = (getFileTransferNotificationRepository as any).impl as FakeImpl<
  FileTransferNotificationRepository
>;

describe("FileTransferNotificationsApiFunction", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("get", () => {
    it("returns a list of file transfer notifications", async () => {
      const notification = buildFileTransferNotification();
      repository.findAll!.mockResolvedValue([notification]);

      const response = await handler(
        {
          httpMethod: "GET",
          path: "/file-transfers/notifications",
        },
        {},
      );

      expect(response.body).toEqual(JSON.stringify([notification]));
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe("delete /:id", () => {
    it("deletes a file transfer notification by id", async () => {
      const response = await handler(
        {
          httpMethod: "DELETE",
          path: "/file-transfers/notifications/6e6e94dd-aa5e-47bb-a2df-7f21cafed71e",
        },
        {},
      );

      expect(response.statusCode).toEqual(200);
      expect(repository.delete).toHaveBeenCalledWith("6e6e94dd-aa5e-47bb-a2df-7f21cafed71e");
    });
  });
});
