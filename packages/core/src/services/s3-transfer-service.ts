import S3 from "aws-sdk/clients/s3";
import { parse } from "url";

import { BUCKETS } from "../interfaces/aws-metadata-keys";
import { Factory } from "../interfaces/base-types";
import { Connection } from "../interfaces/connection";
import Event from "../interfaces/event";
import logger from "../logger";
import NucleusMetadataService from "./nucleus-metadata-service";
import TemporaryCredentialsFactory from "./temporary-credentials-factory";

export default class S3TransferService {
  private metadata: NucleusMetadataService;
  private s3ClientFactory: Factory<S3>;
  private tempCredentialsFactory: TemporaryCredentialsFactory;

  constructor(
    metadata: NucleusMetadataService,
    s3ClientFactory: Factory<S3>,
    tempCredentialsFactory: TemporaryCredentialsFactory,
  ) {
    this.metadata = metadata;
    this.s3ClientFactory = s3ClientFactory;
    this.tempCredentialsFactory = tempCredentialsFactory;
  }

  public async transferObject(connection: Connection, event: Event) {
    const externalS3 = this.s3ClientFactory({
      credentials: await this.tempCredentialsFactory.getCredentials(
        connection.externalConnection.arn,
        connection.externalConnection.externalId,
      ),
    });

    logger.info(`Fetching object ${event.content.key} from external upload bucket.`);
    const object = await externalS3
      .getObject({
        Bucket: connection.metadata.UploadS3Bucket,
        Key: event.content.key,
      })
      .promise();

    const internalS3 = this.s3ClientFactory();
    const downloadBucket = await this.metadata.getMetadataValue(BUCKETS.download);
    const endpointHostname = parse(connection.endpoint).hostname;

    logger.info(`Storing object ${event.content.key} into download bucket.`);
    await internalS3
      .putObject({
        Body: object.Body,
        Bucket: downloadBucket.value,
        Key: `${endpointHostname}/${event.content.key}`,
        Metadata: object.Metadata,
      })
      .promise();
  }
}
