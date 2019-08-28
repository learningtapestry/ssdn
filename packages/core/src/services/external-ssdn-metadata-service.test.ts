import { PUBLIC_METADATA } from "../interfaces/aws-metadata-keys";
import { Connection } from "../interfaces/connection";
import ExternalSSDNMetadataService from "./external-ssdn-metadata-service";

const connection: Connection = {
  connection: {
    arn: "",
    awsAccountId: "",
    externalId: "",
    roleName: "",
    ssdnId: "",
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
    AwsRegion: "TestRegion",
    EventProcessorStream: "TestStream",
    UploadS3Bucket: "TestUploadBucket",
  },
  outputStreams: [],
  updateDate: "",
};

describe("ExternalSSDNMetadataService", () => {
  describe("getConfigurationValue", () => {
    it("returns the value for an output key", async () => {
      const stream = await new ExternalSSDNMetadataService(connection).getMetadataValue(
        PUBLIC_METADATA.EventProcessorStream,
      );
      expect(stream.value).toEqual("TestStream");
    });
  });

  describe("getEndpoint", () => {
    it("returns the endpoint for the instance", async () => {
      const endpoint = await new ExternalSSDNMetadataService(connection).getEndpoint();
      expect(endpoint).toEqual({ value: "https://test.com/connections" });
    });
  });

  describe("getPublicMetadata", () => {
    it("returns public metadata for the instance", async () => {
      const metadata = await new ExternalSSDNMetadataService(connection).getPublicMetadata();
      expect(metadata).toEqual({
        AwsRegion: "TestRegion",
        EventProcessorStream: "TestStream",
        UploadS3Bucket: "TestUploadBucket",
      });
    });
  });
});
