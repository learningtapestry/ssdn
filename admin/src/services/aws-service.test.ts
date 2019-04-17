import { CloudFormation, CloudWatchLogs, CognitoIdentityServiceProvider, DynamoDB } from "aws-sdk";
import AWS from "aws-sdk-mock";
import * as factories from "../../test-support/factories";
import * as responses from "../../test-support/service-responses";
import AWSService from "./aws-service";

describe(AWSService, () => {
  afterEach(() => {
    AWS.restore();
  });

  describe("retrieveConnectionRequests", () => {
    it("retrieves the requests from the DynamoDB table", async () => {
      AWS.mock("DynamoDB.DocumentClient", "scan", responses.connectionRequestItems());

      const requests = await AWSService.retrieveConnectionRequests({
        documentClient: new DynamoDB.DocumentClient(),
        type: "provider",
      });

      expect(requests).toEqual(factories.connectionRequests());
    });
  });

  describe("availableStacks", () => {
    it("retrieves the available stacks and return instances", async () => {
      AWS.mock("CloudFormation", "describeStacks", responses.cloudFormationStacks());

      const availableStacks = await AWSService.availableStacks({
        cloudFormation: new CloudFormation(),
      });

      expect(availableStacks).toEqual(factories.instances());
    });
  });

  describe("retrieveLogGroups", () => {
    it("retrieves the log groups from CloudWatch", async () => {
      AWS.mock("CloudWatchLogs", "describeLogGroups", responses.logGroups());

      const logGroups = await AWSService.retrieveLogGroups({
        cloudWatchLogs: new CloudWatchLogs(),
      });

      expect(logGroups).toEqual(factories.logGroups());
    });
  });

  describe("retrieveLogEvents", () => {
    it("retrieves the log events from CloudWatch", async () => {
      AWS.mock("CloudWatchLogs", "describeLogStreams", responses.logStreams());
      AWS.mock("CloudWatchLogs", "getLogEvents", responses.logEvents());

      const logEvents = await AWSService.retrieveLogEvents(
        "/aws/lambda/Nucleus-AuthorizeBeaconFunction-1P2GO4YF9VZA7",
        { cloudWatchLogs: new CloudWatchLogs() },
      );

      expect(logEvents).toEqual(factories.logEvents());
    });
  });

  describe("retrieveUsers", () => {
    it("retrieves the current users in the pool", async () => {
      AWS.mock("CognitoIdentityServiceProvider", "listUsers", responses.cognitoUsers());

      const users = await AWSService.retrieveUsers({
        cognitoIdentityServiceProvider: new CognitoIdentityServiceProvider(),
      });

      expect(users).toEqual(factories.users());
    });
  });
});
