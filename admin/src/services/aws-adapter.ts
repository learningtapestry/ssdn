/**
 * aws-adapter.ts: Converts AWS types to internal ones
 */

import { CloudFormation } from "aws-sdk";
import Instance from "../interfaces/instance";
import Setting from "../interfaces/setting";

export default class AWSAdapter {
  public static convertStacks(stacks: CloudFormation.Stack[]): Instance[] {
    return stacks.map((stack) => ({
      name: stack.StackName,
      settings: AWSAdapter.convertOutputs(stack.Outputs!),
    }));
  }

  public static convertOutputs(outputs: CloudFormation.Output[]): Setting[] {
    return outputs.map((output) => ({
      description: output.Description!,
      key: output.OutputKey!,
      value: output.OutputValue!,
    }));
  }
}
