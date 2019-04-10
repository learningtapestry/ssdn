/**
 * aws-service.ts: Main service that interacts with the AWS APIs and SDKs
 */

import Auth from "@aws-amplify/auth";
import AWS from "aws-sdk";
import CloudFormation from "aws-sdk/clients/cloudformation";
import { filter } from "lodash/fp";
import awsmobile from "../aws-exports";
import AWSAdapter from "./aws-adapter";

export default class AWSService {
  public static async configure() {
    Auth.configure(awsmobile);
    AWS.config.update({
      credentials: await Auth.currentCredentials(),
      region: awsmobile.aws_project_region,
    });
    AWS.config.apiVersions = {
      cloudformation: "2010-05-15",
    };
  }

  public static async availableStacks({ cloudFormation = new CloudFormation() } = {}) {
    const stackData = await cloudFormation.describeStacks().promise();

    if (stackData.Stacks) {
      const isNucleusStack = (stack: CloudFormation.Stack) =>
        stack.StackName.toLowerCase().startsWith("nucleus");

      return AWSAdapter.convertStacks(filter(isNucleusStack)(stackData.Stacks));
    }
  }
}
