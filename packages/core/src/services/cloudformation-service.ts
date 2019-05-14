import CloudFormation from "aws-sdk/clients/cloudformation";

import { getCloudFormationClient } from "../aws-clients";
import { readEnv } from "../helpers/app-helper";

export default class CloudformationService {
  private client: CloudFormation;

  constructor() {
    this.client = getCloudFormationClient();
  }

  public async getCurrentStack() {
    const stacks = await this.client
      .describeStacks({
        StackName: readEnv("NUCLEUS_STACK_ID"),
      })
      .promise();
    return stacks.Stacks![0];
  }
}
