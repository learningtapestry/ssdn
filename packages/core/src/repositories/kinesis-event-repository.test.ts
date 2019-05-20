import Kinesis from "aws-sdk/clients/kinesis";

import xAPIJson from "../../test-support/data-samples/xapi.json";
import { fakeAws, fakeImpl } from "../../test-support/jest-helper";
import NucleusMetadataService from "../services/nucleus-metadata-service";
import KinesisEventRepository from "./kinesis-event-repository";

const fakeKinesis = fakeAws<Kinesis>({
  putRecord: jest.fn(() =>
    Promise.resolve({
      SequenceNumber: "123456",
      ShardId: "shardId-000000000000",
    }),
  ),
  putRecords: jest.fn(() =>
    Promise.resolve({
      FailedRecordCount: 0,
      Records: [
        {
          SequenceNumber: "123456",
          ShardId: "shardId-000000000000",
        },
        {
          SequenceNumber: "123456",
          ShardId: "shardId-000000000000",
        },
      ],
    }),
  ),
});

const fakeMetadataService = fakeImpl<NucleusMetadataService>({
  getMetadataValue: jest.fn(() =>
    Promise.resolve({
      EventProcessorStream: "EventProcessorStream",
    }),
  ),
});

describe("KinesisEventRepository", () => {
  describe("store", () => {
    it("puts the content into the stream", async () => {
      const repo = new KinesisEventRepository(fakeMetadataService, fakeKinesis);
      const recordAttrs = await repo.store(xAPIJson);
      expect(recordAttrs).toHaveProperty("ShardId", "shardId-000000000000");
      expect(recordAttrs).toHaveProperty("SequenceNumber");
    });
    it("works with strings", async () => {
      const repo = new KinesisEventRepository(fakeMetadataService, fakeKinesis);
      const recordAttrs = await repo.store(JSON.stringify(xAPIJson));
      expect(recordAttrs).toHaveProperty("ShardId", "shardId-000000000000");
      expect(recordAttrs).toHaveProperty("SequenceNumber");
    });
  });
  describe("storeBatch", () => {
    it("puts batch content into the stream", async () => {
      const repo = new KinesisEventRepository(fakeMetadataService, fakeKinesis);
      const recordAttrs = await repo.storeBatch([xAPIJson, xAPIJson]);
      expect(recordAttrs).toHaveProperty("Records");
      expect(recordAttrs.Records).toHaveLength(2);
      for (const i of [0, 1]) {
        expect(recordAttrs.Records[i]).toHaveProperty("ShardId", "shardId-000000000000");
        expect(recordAttrs.Records[i]).toHaveProperty("SequenceNumber");
      }
    });
    it("works with strings", async () => {
      const repo = new KinesisEventRepository(fakeMetadataService, fakeKinesis);
      const recordAttrs = await repo.storeBatch([
        JSON.stringify(xAPIJson),
        JSON.stringify(xAPIJson),
      ]);
      expect(recordAttrs).toHaveProperty("Records");
      expect(recordAttrs.Records).toHaveLength(2);
      for (const i of [0, 1]) {
        expect(recordAttrs.Records[i]).toHaveProperty("ShardId", "shardId-000000000000");
        expect(recordAttrs.Records[i]).toHaveProperty("SequenceNumber");
      }
    });
  });
});
