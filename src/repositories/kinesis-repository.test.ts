import xAPIJson from "../../test-support/data-samples/xapi.json";
import KinesisRepository from "./kinesis-repository";

describe("KinesisRepository", () => {
    describe("constructor", () => {
        it("builds kinesis client using default endpoint", () => {
            process.env.NUCLEUS_EVENT_PROCESSOR_STREAM_ENDPOINT = "";
            const client = new KinesisRepository().client;

            expect(typeof client).toEqual("object");
            expect(client.endpoint.host).toEqual("kinesis.us-east-1.amazonaws.com");
        });

        it("builds kinesis client using provided endpoint", () => {
            process.env.NUCLEUS_EVENT_PROCESSOR_STREAM_ENDPOINT = "http://localhost:4568";
            const client = new KinesisRepository().client;

            expect(typeof client).toEqual("object");
            expect(client.endpoint.host).toEqual("localhost:4568");
        });
    });

    describe("store", () => {
        it("puts the content into the stream", async () => {
            const repo = new KinesisRepository();

            const recordAttrs = await repo.store(xAPIJson);

            expect(recordAttrs).toHaveProperty("ShardId", "shardId-000000000000");
            expect(recordAttrs).toHaveProperty("SequenceNumber");
        });
    });
});
