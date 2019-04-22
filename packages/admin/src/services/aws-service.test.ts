import { CloudFormation, CloudWatchLogs, CognitoIdentityServiceProvider, DynamoDB } from "aws-sdk";
import * as factories from "../../test-support/factories";
import * as responses from "../../test-support/service-responses";
import { mockWithPromise } from "../../test-support/test-helper";
import AWSService from "./aws-service";

describe(AWSService, () => {
  describe("retrieveConnectionRequests", () => {
    it("retrieves the requests from the DynamoDB table", async () => {
      DynamoDB.DocumentClient.prototype.scan = mockWithPromise(responses.connectionRequestItems());

      const requests = await AWSService.retrieveConnectionRequests({
        type: "provider",
      });

      expect(requests).toEqual(factories.connectionRequests());
    });
  });

  describe("availableStacks", () => {
    it("retrieves the available stacks and return instances", async () => {
      CloudFormation.prototype.describeStacks = mockWithPromise(responses.cloudFormationStacks());

      const availableStacks = await AWSService.availableStacks();

      expect(availableStacks).toEqual(factories.instances());
    });
  });

  describe("retrieveLogGroups", () => {
    it("retrieves the log groups from CloudWatch", async () => {
      CloudWatchLogs.prototype.describeLogGroups = mockWithPromise(responses.logGroups());
      CloudWatchLogs.prototype.describeLogStreams = mockWithPromise(responses.logStreams());
      CloudWatchLogs.prototype.getLogEvents = mockWithPromise(responses.logEvents());

      const logGroups = await AWSService.retrieveLogGroups();

      expect(logGroups).toEqual(factories.logGroups());
    });
  });

  describe("retrieveLogEvents", () => {
    it("retrieves the log events from CloudWatch", async () => {
      CloudWatchLogs.prototype.describeLogGroups = mockWithPromise(responses.logGroups());
      CloudWatchLogs.prototype.describeLogStreams = mockWithPromise(responses.logStreams());
      CloudWatchLogs.prototype.getLogEvents = mockWithPromise(responses.logEvents());

      const logEvents = await AWSService.retrieveLogEvents(
        "/aws/lambda/Nucleus-AuthorizeBeaconFunction-1P2GO4YF9VZA7",
      );

      expect(logEvents).toEqual(factories.logEvents());
    });
  });

  describe("retrieveUsers", () => {
    it("retrieves the current users in the pool", async () => {
      CognitoIdentityServiceProvider.prototype.listUsers = mockWithPromise(
        responses.cognitoUsers(),
      );

      const users = await AWSService.retrieveUsers();

      expect(users).toEqual(factories.users());
    });
  });
});
