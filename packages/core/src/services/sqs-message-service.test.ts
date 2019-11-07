import SNS from "aws-sdk/clients/sns";

import ssdnEvent from "../../test-support/data-samples/sqs-message-ssdn-event.json";
import { fakeAws, fakeImpl } from "../../test-support/jest-helper";
import { TOPICS } from "../interfaces/aws-metadata-keys";
import Event from "../interfaces/event";
import SQSMessageService from "./sqs-message-service";
import SSDNMetadataService from "./ssdn-metadata-service";

const fakeMetadata = fakeImpl<SSDNMetadataService>({
  getMetadataValue: jest.fn((key: string) =>
    Promise.resolve({
      value: ({
        [TOPICS.sqsIntegrationNotifications]: "NotificationsTopic",
      } as any)[key],
    }),
  ),
});

const fakeSNS = fakeAws<SNS>({ publish: jest.fn() });

const service = new SQSMessageService(fakeMetadata, fakeSNS);

describe("SQSMessageService", () => {
  describe("process", () => {
    const inMemoryRepository = { store: jest.fn(), storeBatch: jest.fn() };

    beforeEach(() => {
      inMemoryRepository.store.mockImplementation((arg1: any) => arg1);
    });

    it("stores the content", async () => {
      await service.process(ssdnEvent as Event, inMemoryRepository);

      expect(inMemoryRepository.store).toHaveBeenCalledWith(ssdnEvent);
    });

    it("wraps any uncontrolled error", async () => {
      inMemoryRepository.store.mockImplementation(() => {
        throw new Error("Unexpected error message");
      });

      const results = await service.process(ssdnEvent as Event, inMemoryRepository);

      expect(results).toHaveProperty(
        "message",
        "There was an unexpected error while processing the event",
      );
      expect(results).toHaveProperty("errors", ["Unexpected error message"]);
    });
  });
});
