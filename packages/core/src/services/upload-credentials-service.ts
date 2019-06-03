/**
 * upload-credentials-service.ts: Generates temporary credentials assuming an IAM role that can be
 * used to upload files to a specific folder inside an S3 bucket.
 */

import S3 from "aws-sdk/clients/s3";
import STS from "aws-sdk/clients/sts";
import { timeIdentifier } from "../helpers/app-helper";
import { BUCKETS, ROLES } from "../interfaces/aws-metadata-keys";
import { Format } from "../interfaces/format";
import logger from "../logger";
import NucleusMetadataService from "./nucleus-metadata-service";

export default class UploadCredentialsService {
  private folder!: string;
  private uploadBucket!: string;

  constructor(
    private metadata: NucleusMetadataService,
    private stsClient: STS,
    private s3Client: S3,
  ) {}

  public async generate(namespace: string, format: Format) {
    this.uploadBucket = (await this.metadata.getMetadataValue(BUCKETS.upload)).value;
    this.folder = [namespace, format].join("/");
    const uploadFileRole = (await this.metadata.getMetadataValue(ROLES.uploadFile)).value;

    await this.createFolder();

    const assumeRoleResponse = await this.stsClient
      .assumeRole({
        DurationSeconds: 3600,
        Policy: this.bucketPolicy(),
        RoleArn: uploadFileRole,
        RoleSessionName: `Nucleus-UploadFile-${timeIdentifier()}`,
      })
      .promise();

    logger.debug("Assumed role returned by STS: %j", assumeRoleResponse);

    return this.buildCredentials(assumeRoleResponse);
  }

  private async createFolder() {
    try {
      await this.s3Client
        .headObject({ Bucket: this.uploadBucket, Key: `${this.folder}/` })
        .promise();
    } catch (error) {
      if (error.code === "NotFound") {
        logger.info(`Folder '${this.folder}' does not exist, so it will be created.`);
        await this.s3Client
          .putObject({ Bucket: this.uploadBucket, Key: `${this.folder}/` })
          .promise();
      } else {
        throw new Error(error);
      }
    }
  }

  private buildCredentials(assumeRoleResponse: STS.AssumeRoleResponse) {
    logger.info(`Generating credentials to access '${this.uploadBucket}/${this.folder}'`);

    return {
      credentials: {
        accessKeyId: assumeRoleResponse.Credentials!.AccessKeyId,
        secretAccessKey: assumeRoleResponse.Credentials!.SecretAccessKey,
        sessionToken: assumeRoleResponse.Credentials!.SessionToken,
      },
      instructions: this.instructions(),
    };
  }

  private instructions() {
    return [
      "Please use these temporary credentials to configure your S3 client.",
      "They will expire in 1 hour, and are only valid to upload files inside",
      `the '${this.folder}' folder.`,
      "See the documentation at https://docs.aws.amazon.com/cli/latest/userguide/",
      "for more information.",
    ].join(" ");
  }

  private bucketPolicy() {
    const policy = {
      Statement: [
        {
          Action: ["s3:listBucket"],
          Effect: "Allow",
          Resource: [`arn:aws:s3:::${this.uploadBucket}`],
        },
        {
          Action: ["s3:PutObject"],
          Effect: "Allow",
          Resource: [`arn:aws:s3:::${this.uploadBucket}/${this.folder}/*`],
        },
      ],
      Version: "2012-10-17",
    };

    logger.debug("Session policy set to: %j", policy);

    return JSON.stringify(policy);
  }
}
