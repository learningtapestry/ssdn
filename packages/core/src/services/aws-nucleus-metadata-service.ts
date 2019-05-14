import CloudFormation from "aws-sdk/clients/cloudformation";

import { NucleusError } from "../errors/nucleus-error";
import { readEnv } from "../helpers/app-helper";
import TtlCache from "../helpers/ttl-cache";
import { API, STREAMS } from "../interfaces/aws-metadata-keys";
import { MetadataKey } from "../interfaces/base-types";
import logger from "../logger";
import NucleusMetadataService from "./nucleus-metadata-service";

export default class AwsNucleusMetadataService implements NucleusMetadataService {
  private client: CloudFormation;

  private cache = new TtlCache<string, CloudFormation.Stack>(60 * 60 * 1000);

  constructor(client: CloudFormation) {
    this.client = client;
  }

  public async getMetadataValue(configurationKey: MetadataKey) {
    const stack = await this.cache.get("CurrentStack", () => this.getCurrentStack());
    const output = stack.Outputs!.find((o) => o.OutputKey === configurationKey);
    if (!output) {
      logger.error(`Looked for configuration key that does not exist: ${configurationKey}`);
      throw new NucleusError(
        "A fatal error occurred when processing the request. The issue has been reported.",
        500,
      );
    }
    return { value: output.OutputValue! };
  }

  public async getEndpoint() {
    return await this.getMetadataValue(API.exchange);
  }

  public async getPublicMetadata() {
    const eventProcessorStreamName = await this.getMetadataValue(STREAMS.eventProcessor);
    return {
      EventProcessorStream: eventProcessorStreamName.value,
    };
  }

  private async getCurrentStack() {
    const stacks = await this.client
      .describeStacks({
        StackName: readEnv("NUCLEUS_STACK_ID"),
      })
      .promise();
    return stacks.Stacks![0];
  }
}
