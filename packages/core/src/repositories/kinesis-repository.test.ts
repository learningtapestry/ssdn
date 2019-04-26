import xAPIJson from "../../test-support/data-samples/xapi.json";
import { readEnv } from "../helpers/app-helper";
import KinesisRepository from "./kinesis-repository";

const streamName = readEnv("NUCLEUS_EVENT_PROCESSOR_STREAM_NAME");

describe("KinesisRepository", () => {
  // Preserve the environment for each test, since it will be modified.
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  describe("constructor", () => {
    it("builds kinesis client using default endpoint", () => {
      process.env.NUCLEUS_KINESIS_ENDPOINT = "";
      const client = new KinesisRepository(streamName).client;

      expect(typeof client).toEqual("object");
      expect(client.endpoint.host).toEqual("kinesis.us-east-1.amazonaws.com");
    });

    it("builds kinesis client using provided endpoint", () => {
      process.env.NUCLEUS_KINESIS_ENDPOINT = "http://localhost:4568";
      const client = new KinesisRepository(streamName).client;

      expect(typeof client).toEqual("object");
      expect(client.endpoint.host).toEqual("localhost:4568");
    });
  });

  describe("store", () => {
    it("puts the content into the stream", async () => {
      const repo = new KinesisRepository(streamName);

      const recordAttrs = await repo.store(xAPIJson);

      expect(recordAttrs).toHaveProperty("ShardId", "shardId-000000000000");
      expect(recordAttrs).toHaveProperty("SequenceNumber");
    });

    it("works with strings", async () => {
      const repo = new KinesisRepository(streamName);

      const recordAttrs = await repo.store(JSON.stringify(xAPIJson));

      expect(recordAttrs).toHaveProperty("ShardId", "shardId-000000000000");
      expect(recordAttrs).toHaveProperty("SequenceNumber");
    });
  });

  describe("storeBatch", () => {
    it("puts batch content into the stream", async () => {
      const repo = new KinesisRepository(streamName);

      const recordAttrs = await repo.storeBatch([xAPIJson, xAPIJson]);

      expect(recordAttrs).toHaveProperty("Records");
      expect(recordAttrs.Records).toHaveLength(2);

      for (const i of [0, 1]) {
        expect(recordAttrs.Records[i]).toHaveProperty("ShardId", "shardId-000000000000");
        expect(recordAttrs.Records[i]).toHaveProperty("SequenceNumber");
      }
    });

    it("works with strings", async () => {
      const repo = new KinesisRepository(streamName);

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
