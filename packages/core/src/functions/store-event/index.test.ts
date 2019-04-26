import { Context } from "aws-lambda";

import kinesisEvent from "../../../test-support/lambda-events/store-event-kinesis.json";
import KinesisRepository from "../../repositories/kinesis-repository";
import { handler } from "./index";

jest.mock("../../repositories/kinesis-repository");

const mockRepo = (KinesisRepository as unknown) as jest.Mock<KinesisRepository>;

// We can't use jest's `mockImplementation` here because it doesn't populate the instances
// the mock's `.instances` method.
mockRepo.prototype.storeBatch = jest.fn(async (records: any[]) => ({
  FailedRecordCount: 0,
  Records: records.map((r) => ({
    SequenceNumber: 1,
    ShardId: "",
  })),
}));

describe("StoreEventFunction", () => {
  beforeEach(() => {
    mockRepo.mockClear();
  });

  it("fans out records", (done) => {
    handler(kinesisEvent, {} as Context, (error) => {
      expect(error).toBeNull();
      expect(KinesisRepository).toHaveBeenCalledTimes(1);
      expect(kinesisEvent).toHaveProperty("Records"); // Sanity check
      expect(mockRepo.mock.instances[0].storeBatch).toHaveBeenCalledWith(
        kinesisEvent.Records.map((r) => r.kinesis.data),
      );
      done();
    });
  });
});
