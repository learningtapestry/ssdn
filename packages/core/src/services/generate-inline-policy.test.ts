import { buildConnection } from "../../test-support/factories";
import { StreamStatus } from "../interfaces/stream";
import GenerateInlinePolicy from "./generate-inline-policy";

describe("GenerateInlinePolicy", () => {
  describe("generate", () => {
    it("generates a consumer policy", () => {
      const connection = buildConnection({
        isConsumer: true,
        outputStreams: [
          { namespace: "https://blue.com", format: "Caliper", status: StreamStatus.Paused },
          { namespace: "https://blue.com", format: "xAPI", status: StreamStatus.Active },
        ],
      });
      expect(
        GenerateInlinePolicy.generate(
          {
            AwsRegion: "RedRegion",
            EventProcessorStream: "RedStream",
            UploadS3Bucket: "RedUploadS3Bucket",
          },
          connection,
        ),
      ).toEqual({
        Statement: [
          {
            Action: ["s3:listBucket"],
            Effect: "Allow",
            Resource: ["arn:aws:s3:::RedUploadS3Bucket"],
          },
          {
            Action: ["s3:GetObject"],
            Effect: "Allow",
            Resource: ["arn:aws:s3:::RedUploadS3Bucket/https://blue.com/xAPI/*"],
          },
        ],
        Version: "2012-10-17",
      });
    });

    it("generates a provider policy", () => {
      const connection = buildConnection({
        isConsumer: false,
        outputStreams: [
          { namespace: "https://blue.com", format: "Caliper", status: StreamStatus.Paused },
          { namespace: "https://blue.com", format: "xAPI", status: StreamStatus.Active },
        ],
      });
      expect(
        GenerateInlinePolicy.generate(
          {
            AwsRegion: "RedRegion",
            EventProcessorStream: "RedStream",
            UploadS3Bucket: "RedUploadS3Bucket",
          },
          connection,
        ),
      ).toEqual({
        Statement: [],
        Version: "2012-10-17",
      });
    });
  });
});
