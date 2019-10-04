/**
 * aws-service.ts: Main service that interacts with the AWS APIs and SDKs
 */
import API from "@aws-amplify/api";
import Auth from "@aws-amplify/auth";
import Amplify from "@aws-amplify/core";
import ApiGateway from "aws-sdk/clients/apigateway";
import CloudFormation from "aws-sdk/clients/cloudformation";
import CloudWatchLogs from "aws-sdk/clients/cloudwatchlogs";
import CognitoIdentityServiceProvider from "aws-sdk/clients/cognitoidentityserviceprovider";
import DynamoDB from "aws-sdk/clients/dynamodb";
import Lambda from "aws-sdk/clients/lambda";
import SQS from "aws-sdk/clients/sqs";
import { config } from "aws-sdk/global";
import { flatMap, map } from "lodash/fp";
import { nullInstance } from "../app-helper";
import awsconfiguration from "../aws-configuration";
import awsmobile from "../aws-exports";
import { Connection } from "../interfaces/connection";
import { ConnectionRequest, NewConnectionRequest } from "../interfaces/connection-request";
import { FileTransferNotification } from "../interfaces/file-transfer-notification";
import { Format, NewFormat } from "../interfaces/format";
import Setting from "../interfaces/setting";
import UserForm from "../interfaces/user-form";
import AWSAdapter from "./aws-adapter";

export default class AWSService {
  public static async configure() {
    Amplify.configure({
      ...awsmobile,
      API: awsconfiguration.Api,
      Auth: awsconfiguration.Auth,
    });
    await AWSService.updateCredentials();
    config.apiVersions = {
      apigateway: "2015-07-09",
      cloudformation: "2010-05-15",
      cloudwatchlogs: "2014-03-28",
      cognitoidentityserviceprovider: "2016-04-18",
      dynamodb: "2012-08-10",
      lambda: "2015-03-31",
      sqs: "2012-11-05",
    };
  }

  public static async updateCredentials() {
    config.update({
      credentials: await Auth.currentCredentials(),
      region: awsmobile.aws_project_region,
    });
  }

  public static async retrieveFormats(): Promise<Format[]> {
    return AWSService.withCredentials(async () => {
      const response = await API.get("EntitiesApi", "/formats", {});
      return response as Format[];
    });
  }

  public static async retrieveFormat(name: string): Promise<Format> {
    return AWSService.withCredentials(async () => {
      const response = await API.get("EntitiesApi", `/formats/${name}`, {});
      return response as Format;
    });
  }

  public static async updateFormat(format: Format): Promise<Format> {
    return AWSService.withCredentials(async () => {
      const response = await API.patch("EntitiesApi", `/formats/${format.name}`, {
        body: format,
      });
      return response as Format;
    });
  }

  public static async createFormat(format: NewFormat): Promise<Format> {
    return AWSService.withCredentials(async () => {
      const response = await API.post("EntitiesApi", "/formats", {
        body: format,
      });
      return response as Format;
    });
  }

  public static async deleteFormat(name: string): Promise<void> {
    return AWSService.withCredentials(async () => {
      await API.del("EntitiesApi", `/formats/${name}`, {});
    });
  }

  public static async retrieveStreams(type: "input" | "output") {
    return AWSService.withCredentials(async () => {
      const documentClient = new DynamoDB.DocumentClient();
      const filterAttr = type === "input" ? "inputStreams" : "outputStreams";
      const items = await documentClient
        .scan({
          FilterExpression: `attribute_exists(${filterAttr}[0])`,
          TableName: awsconfiguration.Storage.ssdnConnections,
        })
        .promise();

      if (!items.Items) {
        return [];
      }

      return flatMap((e: Connection) =>
        e[filterAttr]!.map((ex) => ({
          endpoint: e.endpoint,
          format: ex.format,
          namespace: ex.namespace,
          status: ex.status,
        })),
      )(items.Items as Connection[]).sort((a, b) =>
        `${a.endpoint}.${a.namespace}.${a.format}`.localeCompare(
          `${a.endpoint}.${b.namespace}.${b.format}`,
        ),
      );
    });
  }

  public static async retrieveConnectionRequests(type: "incoming" | "submitted") {
    const tableName =
      type === "incoming"
        ? awsconfiguration.Storage.ssdnIncomingConnectionRequests
        : awsconfiguration.Storage.ssdnConnectionRequests;

    return AWSService.withCredentials(async () => {
      const documentClient = new DynamoDB.DocumentClient();
      const connectionRequests = await documentClient
        .scan({
          TableName: tableName,
        })
        .promise();

      return (connectionRequests.Items as ConnectionRequest[]).sort(
        (a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime(),
      );
    });
  }

  public static async updateStream(
    endpoint: string,
    format: string,
    namespace: string,
    status: "active" | "paused",
    type: "input" | "output",
  ) {
    return AWSService.withCredentials(async () => {
      await API.post("ExchangeApiSigv4", "/connections/streams/update", {
        body: {
          endpoint,
          stream: {
            format,
            namespace,
            status,
          },
          streamType: type,
        },
      });
    });
  }

  public static async saveConnectionRequest(
    connectionRequest: NewConnectionRequest,
  ): Promise<ConnectionRequest> {
    return AWSService.withCredentials(async () => {
      const response = await API.post("ExchangeApi", "/connections/requests", {
        body: connectionRequest,
      });
      return response as ConnectionRequest;
    });
  }

  public static async acceptConnectionRequest(endpoint: string, id: string, accepted: boolean) {
    return AWSService.withCredentials(async () => {
      const response = await API.post("ExchangeApi", "/connections/incoming-requests/accept", {
        body: {
          accepted,
          endpoint,
          id,
        },
      });
      return response as ConnectionRequest;
    });
  }

  public static async retrieveStack() {
    return AWSService.withCredentials(async () => {
      const cloudFormation = new CloudFormation();
      const stackData = await cloudFormation.describeStacks().promise();

      if (stackData.Stacks) {
        const stack = stackData.Stacks.find(
          (s: CloudFormation.Stack) => s.StackName === awsconfiguration.Auth.stackName,
        );
        if (stack) {
          return AWSAdapter.convertStack(stack);
        }
      }
      return nullInstance();
    });
  }

  public static async retrieveLogGroups() {
    return AWSService.withCredentials(async () => {
      const cloudWatchLogs = new CloudWatchLogs();
      const logGroupsData = await cloudWatchLogs
        .describeLogGroups({
          logGroupNamePrefix: `/aws/lambda/${awsconfiguration.Auth.stackName.substring(0, 15)}`,
        })
        .promise();

      return map("logGroupName")(logGroupsData.logGroups);
    });
  }

  public static async retrieveLogEvents(logGroup: string) {
    return AWSService.withCredentials(async () => {
      const cloudWatchLogs = new CloudWatchLogs();
      const streamsData = await cloudWatchLogs
        .describeLogStreams({ logGroupName: logGroup, orderBy: "LastEventTime", descending: true })
        .promise();
      const eventsData = await cloudWatchLogs
        .getLogEvents({
          logGroupName: logGroup,
          logStreamName: streamsData.logStreams![0].logStreamName!,
          startFromHead: true,
        })
        .promise();

      return eventsData.events ? AWSAdapter.convertLogEvents(eventsData.events) : [];
    });
  }

  public static async retrieveUsers() {
    return AWSService.withCredentials(async () => {
      const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider();
      const userData = await cognitoIdentityServiceProvider
        .listUsers({ UserPoolId: awsconfiguration.Auth.userPoolId })
        .promise();

      return userData.Users ? AWSAdapter.convertUsers(userData.Users) : [];
    });
  }

  public static async createUser(userParams: UserForm) {
    return AWSService.withCredentials(async () => {
      const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider();
      return await cognitoIdentityServiceProvider
        .adminCreateUser({
          DesiredDeliveryMediums: ["EMAIL"],
          TemporaryPassword: userParams.password,
          UserAttributes: [
            { Name: "email", Value: userParams.email },
            { Name: "name", Value: userParams.name },
            { Name: "phone_number", Value: userParams.phoneNumber },
            { Name: "email_verified", Value: "true" },
            { Name: "phone_number_verified", Value: "false" },
          ],
          UserPoolId: awsconfiguration.Auth.userPoolId,
          Username: userParams.username,
        })
        .promise();
    });
  }

  public static async deleteUser(username: string) {
    return AWSService.withCredentials(async () => {
      const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider();
      return await cognitoIdentityServiceProvider
        .adminDeleteUser({
          UserPoolId: awsconfiguration.Auth.userPoolId,
          Username: username,
        })
        .promise();
    });
  }

  public static async retrieveApiKey(keyId: string) {
    const key = await new ApiGateway().getApiKey({ apiKey: keyId, includeValue: true }).promise();

    return key.value!;
  }

  public static async retrieveFileTransferNotifications(): Promise<FileTransferNotification[]> {
    return AWSService.withCredentials(async () => {
      const response = await API.get(
        "FileTransferNotificationsApi",
        "/file-transfers/notifications",
        {},
      );
      return response as FileTransferNotification[];
    });
  }

  public static async deleteFileTransferNotification(id: string): Promise<void> {
    return AWSService.withCredentials(async () => {
      await API.del("FileTransferNotificationsApi", `/file-transfers/notifications/${id}`, {});
    });
  }

  public static async retrieveSQSIntegrationFunction() {
    const stack = await this.retrieveStack();
    const functionField = stack.settings.find(
      (setting: Setting) => setting.key === "ProcessSQSMessageFunction",
    );

    return functionField.value;
  }

  public static async retrieveSQSIntegrationNamespace() {
    const functionConfig = await this.retrieveSQSIntegrationConfig();

    return functionConfig.Environment!.Variables!.SSDN_NAMESPACE;
  }

  public static async retrieveSQSIntegrationConfig(lambdaClient = new Lambda()) {
    const integrationFunction = await this.retrieveSQSIntegrationFunction();

    return await lambdaClient
      .getFunctionConfiguration({ FunctionName: integrationFunction })
      .promise();
  }

  public static async updateNamespace(namespace: string, lambdaClient = new Lambda()) {
    const integrationFunction = await this.retrieveSQSIntegrationFunction();
    const currentConfiguration = await this.retrieveSQSIntegrationConfig();

    lambdaClient
      .updateFunctionConfiguration({
        Environment: {
          Variables: {
            ...currentConfiguration.Environment!.Variables,
            SSDN_NAMESPACE: namespace,
          },
        },
        FunctionName: integrationFunction,
      })
      .promise();
  }

  public static async retrieveQueues(sqsClient = new SQS()) {
    return AWSService.withCredentials(async () => {
      const queuesData = await sqsClient.listQueues().promise();

      if (queuesData.QueueUrls) {
        const queueArns = queuesData.QueueUrls.map(async (url) => {
          const attributesData = await sqsClient
            .getQueueAttributes({ QueueUrl: url, AttributeNames: ["QueueArn"] })
            .promise();

          return attributesData.Attributes!.QueueArn;
        });

        return Promise.all(queueArns);
      }
    });
  }

  public static async retrieveQueueMappings(lambdaClient = new Lambda()) {
    const integrationLambda = await this.retrieveSQSIntegrationFunction();

    return AWSService.withCredentials(async () => {
      const mappingsData = await lambdaClient
        .listEventSourceMappings({ FunctionName: integrationLambda })
        .promise();

      return AWSAdapter.convertEventSourceMappings(mappingsData.EventSourceMappings!);
    });
  }

  public static async createQueueMapping(queueArn: string, lambdaClient = new Lambda()) {
    const integrationLambda = await this.retrieveSQSIntegrationFunction();

    return AWSService.withCredentials(async () => {
      return await lambdaClient
        .createEventSourceMapping({
          EventSourceArn: queueArn,
          FunctionName: integrationLambda,
        })
        .promise();
    });
  }

  public static async disableQueueMapping(uuid: string) {
    return await this.updateQueueMapping(uuid, { Enabled: false });
  }

  public static async enableQueueMapping(uuid: string) {
    return await this.updateQueueMapping(uuid, { Enabled: true });
  }

  public static async updateQueueMapping(uuid: string, params = {}, lambdaClient = new Lambda()) {
    return AWSService.withCredentials(async () => {
      return await lambdaClient.updateEventSourceMapping({ UUID: uuid, ...params }).promise();
    });
  }

  public static async deleteQueueMapping(uuid: string, lambdaClient = new Lambda()) {
    return AWSService.withCredentials(async () => {
      return await lambdaClient.deleteEventSourceMapping({ UUID: uuid }).promise();
    });
  }

  private static async withCredentials(request: () => Promise<any>) {
    try {
      try {
        return await request();
      } catch (error) {
        if (error.code && error.code === "CredentialsError") {
          await AWSService.updateCredentials();
          return await request();
        } else {
          throw error;
        }
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.errors) {
        throw new Error(error.response.data.errors[0].detail);
      }
      throw new Error(`An unexpected error occurred: ${error.message}`);
    }
  }
}
