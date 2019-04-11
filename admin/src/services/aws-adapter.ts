/**
 * aws-adapter.ts: Converts AWS types to internal ones
 */

import { CloudFormation, CognitoIdentityServiceProvider } from "aws-sdk";
import { find } from "lodash/fp";
import Instance from "../interfaces/instance";
import Setting from "../interfaces/setting";
import User from "../interfaces/user";

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

  public static convertUsers(users: CognitoIdentityServiceProvider.UserType[]): User[] {
    return users.map((user) => ({
      creationDate: new Date(user.UserCreateDate!),
      email: AWSAdapter.readUserAttribute("email", user.Attributes),
      fullName: AWSAdapter.readUserAttribute("name", user.Attributes),
      phoneNumber: AWSAdapter.readUserAttribute("phone_number", user.Attributes),
      status: user.UserStatus!,
      username: user.Username!,
    }));
  }

  public static readUserAttribute(
    name: string,
    attributes?: CognitoIdentityServiceProvider.AttributeType[],
  ): string {
    const attribute = find({ Name: name })(
      attributes,
    ) as CognitoIdentityServiceProvider.AttributeType;

    return attribute && attribute.Value ? attribute.Value : "N/A";
  }
}
