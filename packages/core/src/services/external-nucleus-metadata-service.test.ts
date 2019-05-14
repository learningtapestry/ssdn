import { PUBLIC_METADATA } from "../interfaces/aws-metadata-keys";
import { Connection } from "../interfaces/connection";
import ExternalNucleusMetadataService from "./external-nucleus-metadata-service";

const connection: Connection = {
  connection: {
    arn: "",
    awsAccountId: "",
    externalId: "",
    nucleusId: "",
  },
  creationDate: "",
  endpoint: "https://test.com/connections",
  externalConnection: {
    arn: "",
    externalId: "",
  },
  inputStreams: [],
  isConsumer: false,
  isProvider: false,
  metadata: {
    EventProcessorStream: "TestStream",
  },
  outputStreams: [],
  updateDate: "",
};

describe("ExternalNucleusMetadataService", () => {
  describe("getConfigurationValue", () => {
    it("returns the value for an output key", async () => {
      const stream = await new ExternalNucleusMetadataService(connection).getMetadataValue(
        PUBLIC_METADATA.EventProcessorStream,
      );
      expect(stream.value).toEqual("TestStream");
    });
  });

  describe("getEndpoint", () => {
    it("returns the endpoint for the instance", async () => {
      const endpoint = await new ExternalNucleusMetadataService(connection).getEndpoint();
      expect(endpoint).toEqual({ value: "https://test.com/connections" });
    });
  });

  describe("getPublicMetadata", () => {
    it("returns public metadata for the instance", async () => {
      const metadata = await new ExternalNucleusMetadataService(connection).getPublicMetadata();
      expect(metadata).toEqual({
        EventProcessorStream: "TestStream",
      });
    });
  });
});
