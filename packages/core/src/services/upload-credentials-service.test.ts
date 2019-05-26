import { AWSError } from "aws-sdk";
import S3 from "aws-sdk/clients/s3";
import STS from "aws-sdk/clients/sts";
import { fakeAws, fakeImpl } from "../../test-support/jest-helper";
import { assumeRole } from "../../test-support/service-responses";
import * as appHelper from "../helpers/app-helper";
import { BUCKETS, ROLES } from "../interfaces/aws-metadata-keys";
import NucleusMetadataService from "./nucleus-metadata-service";
import UploadCredentialsService from "./upload-credentials-service";

describe("UploadCredentialsService", () => {
  const nucleusMetadataMock = fakeImpl<NucleusMetadataService>({
    getMetadataValue: jest.fn((key: string) =>
      Promise.resolve({
        value: ({
          [BUCKETS.upload]: "nucleus-test-uploads3bucket-g38l0vvghtff",
          [ROLES.uploadFile]:
            "arn:aws:iam::264441468378:role/" +
            "Nucleus-learning-tapestry-as25vydn3ekjn2e-UploadFileRole",
        } as any)[key],
      }),
    ),
  });

  const s3Mock = fakeAws<S3>({
    headObject: jest.fn(),
    putObject: jest.fn(),
  });

  const stsMock = fakeAws<STS>({
    assumeRole: jest.fn().mockResolvedValue(assumeRole()),
  });

  const sessionPolicy = JSON.stringify({
    Statement: [
      {
        Action: ["s3:listBucket"],
        Effect: "Allow",
        Resource: ["arn:aws:s3:::nucleus-test-uploads3bucket-g38l0vvghtff"],
      },
      {
        Action: ["s3:PutObject"],
        Effect: "Allow",
        Resource: [
          "arn:aws:s3:::nucleus-test-uploads3bucket-g38l0vvghtff/" +
            "learning-tapestry-as25vydn3ekjn2e/xAPI/*",
        ],
      },
    ],
    Version: "2012-10-17",
  });

  const uploadCredentials = new UploadCredentialsService(nucleusMetadataMock, stsMock, s3Mock);

  describe("generate", () => {
    it("returns temporary permissions and instructions", async () => {
      const response = await uploadCredentials.generate(
        "learning-tapestry-as25vydn3ekjn2e",
        "xAPI",
      );
      expect(response.credentials).toHaveProperty("accessKeyId", "AKIAIOSFODNN7EXAMPLE");
      expect(response.credentials).toHaveProperty(
        "secretAccessKey",
        "wJalrXUtnFEMI/K7MDENG/bPxRfiCYzEXAMPLEKEY",
      );
      expect(response.credentials.sessionToken).toMatch(
        new RegExp("^AQoDYXdzEPT//////////wEXAMPLE"),
      );
      expect(response.instructions).toMatch(/^Please use these temporary credentials to configure/);
      await expect(s3Mock.putObject).not.toHaveBeenCalled();
    });

    it("builds the assumed role with the right values", async () => {
      jest.spyOn(appHelper, "timeIdentifier").mockReturnValue("20190524123456");

      await uploadCredentials.generate("learning-tapestry-as25vydn3ekjn2e", "xAPI");

      await expect(stsMock.assumeRole).toHaveBeenCalledWith({
        DurationSeconds: 3600,
        Policy: sessionPolicy,
        RoleArn:
          "arn:aws:iam::264441468378:role/Nucleus-learning-tapestry-as25vydn3ekjn2e-UploadFileRole",
        RoleSessionName: "Nucleus-UploadFile-20190524123456",
      });
    });

    it("creates the folder inside the bucket when does not exist", async () => {
      s3Mock.headObject = jest.fn().mockReturnValue({
        promise: () => {
          const error = new Error() as AWSError;
          error.code = "NotFound";
          throw error;
        },
      });

      await uploadCredentials.generate("learning-tapestry-as25vydn3ekjn2e", "xAPI");

      await expect(s3Mock.putObject).toHaveBeenCalledWith({
        Bucket: "nucleus-test-uploads3bucket-g38l0vvghtff",
        Key: "learning-tapestry-as25vydn3ekjn2e/xAPI/",
      });
    });
  });
});
