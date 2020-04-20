/**
 * aws-adapter.ts: Converts AWS types to internal ones
 */
import CloudFormation from "aws-sdk/clients/cloudformation";
import CloudWatchLogs from "aws-sdk/clients/cloudwatchlogs";
import CognitoIdentityServiceProvider from "aws-sdk/clients/cognitoidentityserviceprovider";
import find from "lodash/fp/find";

import Lambda from "aws-sdk/clients/lambda";
import Instance from "../interfaces/instance";
import LogEvent from "../interfaces/log-event";
import QueueMapping from "../interfaces/queueMapping";
import Setting from "../interfaces/setting";
import User from "../interfaces/user";

export default class AWSAdapter {
  public static convertStack(stack: CloudFormation.Stack): Instance {
    return {
      name: stack.StackName,
      settings: AWSAdapter.convertOutputs(stack.Outputs!),
    };
  }

  public static convertOutputs(outputs: CloudFormation.Output[]): Setting[] {
    return outputs
      .map((output) => ({
        description: output.Description!,
        key: output.OutputKey!,
        value: output.OutputValue!,
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
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

  public static convertLogEvents(logEvents: CloudWatchLogs.OutputLogEvent[]): LogEvent[] {
    return logEvents.map((event) => ({
      creationDate: new Date(event.timestamp!),
      message: event.message!,
    }));
  }

  public static convertEventSourceMappings(
    eventSourceMappings: Lambda.EventSourceMappingsList,
  ): QueueMapping[] {
    return eventSourceMappings.map((mapping) => ({
      arn: mapping.EventSourceArn!,
      modificationDate: new Date(mapping.LastModified!),
      status: mapping.State!,
      uuid: mapping.UUID!,
    }));
  }
}
