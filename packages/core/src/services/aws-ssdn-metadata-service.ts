import CloudFormation from "aws-sdk/clients/cloudformation";

import { SSDNError } from "../errors/ssdn-error";
import TtlCache from "../helpers/ttl-cache";
import { API, BUCKETS, STREAMS } from "../interfaces/aws-metadata-keys";
import { MetadataKey } from "../interfaces/base-types";
import { PublicSSDNMetadata } from "../interfaces/connection";
import logger from "../logger";
import SSDNMetadataService from "./ssdn-metadata-service";

export default class AwsSSDNMetadataService implements SSDNMetadataService {
  private client: CloudFormation;

  private cache = new TtlCache<string, CloudFormation.Stack>(60 * 60 * 1000);

  private stackId: string;

  constructor(client: CloudFormation, stackId: string) {
    this.client = client;
    this.stackId = stackId;
  }

  public async getMetadataValue(configurationKey: MetadataKey) {
    const stack = await this.cache.get("CurrentStack", () => this.getCurrentStack());
    const output = stack.Outputs!.find((o) => o.OutputKey === configurationKey);
    if (!output) {
      logger.error(`Looked for configuration key that does not exist: ${configurationKey}`);
      throw new SSDNError(
        "A fatal error occurred when processing the request. The issue has been reported.",
        500,
      );
    }
    return { value: output.OutputValue! };
  }

  public async getEndpoint() {
    return await this.getMetadataValue(API.exchange);
  }

  public async getPublicMetadata(): Promise<PublicSSDNMetadata> {
    const eventProcessorStreamName = await this.getMetadataValue(STREAMS.eventProcessor);
    const uploadS3BucketName = await this.getMetadataValue(BUCKETS.upload);
    return {
      EventProcessorStream: eventProcessorStreamName.value,
      UploadS3Bucket: uploadS3BucketName.value,
    };
  }

  private async getCurrentStack() {
    const stacks = await this.client
      .describeStacks({
        StackName: this.stackId,
      })
      .promise();
    return stacks.Stacks![0];
  }
}
