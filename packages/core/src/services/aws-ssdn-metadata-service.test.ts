import CloudFormation from "aws-sdk/clients/cloudformation";

import { fakeAws } from "../../test-support/jest-helper";
import { STREAMS } from "../interfaces/aws-metadata-keys";
import AwsSSDNMetadataService from "./aws-ssdn-metadata-service";

const fakeCloudFormation = fakeAws<CloudFormation>({
  describeStacks: jest.fn(() =>
    Promise.resolve({
      Stacks: [
        {
          Outputs: [
            {
              OutputKey: "AwsRegion",
              OutputValue: "TestValue",
            },
            {
              OutputKey: "EventProcessorStream",
              OutputValue: "TestValue",
            },
            {
              OutputKey: "UploadS3Bucket",
              OutputValue: "TestValue",
            },
            {
              OutputKey: "ExchangeApi",
              OutputValue: "TestValue",
            },
            {
              OutputKey: "EventProcessorStream",
              OutputValue: "TestValue",
            },
          ],
        },
      ],
    }),
  ),
});

const buildMetadataService = () => {
  return new AwsSSDNMetadataService(fakeCloudFormation, "ssdn-test");
};

describe("AwsSSDNMetadataService", () => {
  describe("getConfigurationValue", () => {
    it("returns the value for an output key", async () => {
      const value = await buildMetadataService().getMetadataValue(STREAMS.eventProcessor);
      expect(value).toEqual({ value: "TestValue" });
    });
  });

  describe("getEndpoint", () => {
    it("returns the endpoint for the instance", async () => {
      const endpoint = await buildMetadataService().getEndpoint();
      expect(endpoint).toEqual({ value: "TestValue" });
    });
  });

  describe("getPublicMetadata", () => {
    it("returns public metadata for the instance", async () => {
      const metadata = await buildMetadataService().getPublicMetadata();
      expect(metadata).toEqual({
        AwsRegion: "TestValue",
        EventProcessorStream: "TestValue",
        UploadS3Bucket: "TestValue",
      });
    });
  });
});
