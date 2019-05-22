import S3 from "aws-sdk/clients/s3";
import { TemporaryCredentials } from "aws-sdk/lib/core";

import { buildConnection, buildEvent, buildEventMetadata } from "../../test-support/factories";
import { fakeAws, fakeImpl, mocked } from "../../test-support/jest-helper";
import { BUCKETS } from "../interfaces/aws-metadata-keys";
import NucleusMetadataService from "./nucleus-metadata-service";
import S3TransferService from "./s3-transfer-service";
import TemporaryCredentialsFactory from "./temporary-credentials-factory";

const fakeMetadata = fakeImpl<NucleusMetadataService>({
  getMetadataValue: jest.fn((k: string) =>
    k === BUCKETS.download ? Promise.resolve({ value: "RedBucket" }) : Promise.reject(),
  ),
});

const fakeTempCredentials = ({
  accessKeyId: "1234",
  getPromise: jest.fn(),
  secretAccessKey: "1234",
  sessionToken: "1234",
} as unknown) as TemporaryCredentials;

const fakeTempCredentialsFactory = fakeImpl<TemporaryCredentialsFactory>({
  getCredentials: jest.fn(() => Promise.resolve(fakeTempCredentials)),
});

const fakeS3 = fakeAws<S3>({
  getObject: jest.fn(),
  putObject: jest.fn(),
});

const fakeS3Factory = jest.fn(() => fakeS3);

describe("S3TransferService", () => {
  describe("transferObject", () => {
    it("fetches an object from another instance", async () => {
      const service = new S3TransferService(
        fakeMetadata,
        fakeS3Factory,
        fakeTempCredentialsFactory,
      );

      const connection = buildConnection({
        endpoint: "https://blue.com",
        externalConnection: { arn: "BlueRedArn", externalId: "BlueRedExternalId" },
        metadata: {
          EventProcessorStream: "BlueStream",
          UploadS3Bucket: "BlueBucket",
        },
      });
      const event = buildEvent({
        content: "red.com/Caliper/test.csv",
      });
      mocked((fakeS3.getObject as any).impl).mockResolvedValueOnce({
        Body: "TestBody",
      });

      await service.transferObject(connection, event);
      expect(fakeTempCredentialsFactory.getCredentials).toHaveBeenCalledWith(
        "BlueRedArn",
        "BlueRedExternalId",
      );
      expect(fakeS3Factory).toHaveBeenCalledWith({ credentials: fakeTempCredentials });
      expect(fakeS3.getObject).toHaveBeenCalledWith({
        Bucket: "BlueBucket",
        Key: "red.com/Caliper/test.csv",
      });
      expect(fakeS3.putObject).toHaveBeenCalledWith({
        Body: "TestBody",
        Bucket: "RedBucket",
        Key: "blue.com/red.com/Caliper/test.csv",
      });
    });
  });
});
