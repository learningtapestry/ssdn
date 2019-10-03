import ssdnEvent from "../../test-support/data-samples/sqs-message-ssdn-event.json";
import Event from "../interfaces/event";
import SQSMessageService from "./sqs-message-service";

describe("SQSMessageService", () => {
  describe("process", () => {
    const inMemoryRepository = { store: jest.fn(), storeBatch: jest.fn() };

    beforeEach(() => {
      inMemoryRepository.store.mockImplementation((arg1: any) => arg1);
    });

    it("stores the content", async () => {
      await SQSMessageService.process(ssdnEvent as Event, inMemoryRepository);

      expect(inMemoryRepository.store).toHaveBeenCalledWith(ssdnEvent);
    });

    it("wraps any uncontrolled error", async () => {
      inMemoryRepository.store.mockImplementation(() => {
        throw new Error("Unexpected error message");
      });

      const results = await SQSMessageService.process(ssdnEvent as Event, inMemoryRepository);

      expect(results).toHaveProperty(
        "message",
        "There was an unexpected error while processing the event",
      );
      expect(results).toHaveProperty("errors", ["Unexpected error message"]);
    });
  });
});
