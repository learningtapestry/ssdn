import CloudFormation from "aws-sdk/clients/cloudformation";
import CloudWatchLogs from "aws-sdk/clients/cloudwatchlogs";
import CognitoIdentityServiceProvider from "aws-sdk/clients/cognitoidentityserviceprovider";
import DynamoDB from "aws-sdk/clients/dynamodb";

import API from "@aws-amplify/api";

import * as factories from "../../test-support/factories";
import * as responses from "../../test-support/service-responses";
import { mockWithPromise } from "../../test-support/test-helper";
import { nullConnectionRequest } from "../app-helper";
import awsconfiguration from "../aws-configuration";
import AWSService from "./aws-service";

describe("AWSService", () => {
  describe("retrieveConnectionRequests", () => {
    it("retrieves incoming requests from the DynamoDB table", async () => {
      DynamoDB.DocumentClient.prototype.scan = mockWithPromise(responses.connectionRequestItems());

      const requests = await AWSService.retrieveConnectionRequests("incoming");

      expect(requests).toEqual([
        responses.connectionRequestJonah,
        responses.connectionRequestMickey,
        responses.connectionRequestAdam,
      ]);

      expect(DynamoDB.DocumentClient.prototype.scan).toHaveBeenCalledWith({
        TableName: awsconfiguration.Storage.nucleusIncomingConnectionRequests,
      });
    });

    it("retrieves submitted requests from the DynamoDB table", async () => {
      DynamoDB.DocumentClient.prototype.scan = mockWithPromise(responses.connectionRequestItems());

      const requests = await AWSService.retrieveConnectionRequests("submitted");

      expect(requests).toEqual([
        responses.connectionRequestJonah,
        responses.connectionRequestMickey,
        responses.connectionRequestAdam,
      ]);

      expect(DynamoDB.DocumentClient.prototype.scan).toHaveBeenCalledWith({
        TableName: awsconfiguration.Storage.nucleusConnectionRequests,
      });
    });
  });

  describe("retrieveStreams", () => {
    const mockFormats = [
      {
        endpoint: "https://nucleus.adam.acme.org/",
        format: "xAPI",
        namespace: "nucleus.ajax.org",
        status: "active",
      },
      {
        endpoint: "https://nucleus.jonah.acme.org/",
        format: "xAPI",
        namespace: "nucleus.ajax.org",
        status: "paused",
      },
      {
        endpoint: "https://nucleus.mickey.acme.org/",
        format: "xAPI",
        namespace: "nucleus.ajax.org",
        status: "paused_external",
      },
    ];
    const mockOutputFormats = [
      { ...mockFormats[0], namespace: "nucleus.adam.acme.org" },
      { ...mockFormats[1], namespace: "nucleus.jonah.acme.org" },
      { ...mockFormats[2], namespace: "nucleus.mickey.acme.org" },
    ];

    it("finds inputs", async () => {
      DynamoDB.DocumentClient.prototype.scan = mockWithPromise(responses.connections());
      const streams = await AWSService.retrieveStreams("input");
      expect(streams).toEqual(mockFormats);
      expect(DynamoDB.DocumentClient.prototype.scan).toHaveBeenCalledWith({
        FilterExpression: "attribute_exists(inputStreams[0])",
        TableName: awsconfiguration.Storage.nucleusConnections,
      });
    });

    it("finds outputs", async () => {
      DynamoDB.DocumentClient.prototype.scan = mockWithPromise(responses.connections());
      const streams = await AWSService.retrieveStreams("output");
      expect(streams).toEqual(mockOutputFormats);
      expect(DynamoDB.DocumentClient.prototype.scan).toHaveBeenCalledWith({
        FilterExpression: "attribute_exists(outputStreams[0])",
        TableName: awsconfiguration.Storage.nucleusConnections,
      });
    });
  });

  describe("retrieveStack", () => {
    it("retrieves the available stacks and return instances", async () => {
      CloudFormation.prototype.describeStacks = mockWithPromise(responses.cloudFormationStacks());
      const currentStack = await AWSService.retrieveStack();
      expect(currentStack).toEqual(factories.nucleusStack);
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

  describe("acceptConnectionRequest", () => {
    it("accepts requests with the acceptance API", async () => {
      API.post = jest.fn(async () => nullConnectionRequest());
      AWSService.acceptConnectionRequest("https://test.com", "1", true);
      expect(API.post).toHaveBeenCalledWith(
        "ExchangeApi",
        "/connections/incoming-requests/accept",
        { body: { accepted: true, endpoint: "https://test.com", id: "1" } },
      );
    });
    it("rejects requests with the acceptance API", async () => {
      API.post = jest.fn(async () => nullConnectionRequest());
      await AWSService.acceptConnectionRequest("https://test.com", "1", false);
      expect(API.post).toHaveBeenCalledWith(
        "ExchangeApi",
        "/connections/incoming-requests/accept",
        { body: { accepted: false, endpoint: "https://test.com", id: "1" } },
      );
    });
  });

  describe("saveConnectionRequest", () => {
    it("accepts requests with the acceptance API", async () => {
      const request = nullConnectionRequest();
      API.post = jest.fn(async () => request);
      await AWSService.saveConnectionRequest(request);
      expect(API.post).toHaveBeenCalledWith("ExchangeApi", "/connections/requests", {
        body: nullConnectionRequest(request),
      });
    });
  });

  describe("updateStream", () => {
    it("updates a stream with sigv4", async () => {
      const request = nullConnectionRequest();
      API.post = jest.fn(async () => request);
      await AWSService.updateStream("https://test.com", "xAPI", "test.com", "active", "input");
      expect(API.post).toHaveBeenCalledWith("ExchangeApiSigv4", "/connections/streams/update", {
        body: {
          endpoint: "https://test.com",
          stream: { format: "xAPI", namespace: "test.com", status: "active" },
          streamType: "input",
        },
      });
    });
  });

  describe("retrieveFormats", () => {
    it("retrieves formats from the API", async () => {
      API.get = jest.fn();
      await AWSService.retrieveFormats();
      expect(API.get).toHaveBeenCalledWith("EntitiesApi", "/formats", {});
    });
  });

  describe("retrieveFormat", () => {
    it("retrieves a format from the API", async () => {
      API.get = jest.fn();
      await AWSService.retrieveFormat("test");
      expect(API.get).toHaveBeenCalledWith("EntitiesApi", "/formats/test", {});
    });
  });

  describe("updateFormat", () => {
    it("updates a format with the API", async () => {
      API.patch = jest.fn(() => Promise.resolve({ name: "test" }));
      const format = await AWSService.updateFormat({ name: "test", description: "test" });
      expect(format.name).toEqual("test");
      expect(API.patch).toHaveBeenCalledWith("EntitiesApi", "/formats/test", {
        body: { description: "test", name: "test" },
      });
    });
  });

  describe("createFormat", () => {
    it("creates a format with the API", async () => {
      API.post = jest.fn(() => Promise.resolve({ name: "test" }));
      const format = await AWSService.createFormat({ name: "test", description: "test" });
      expect(format.name).toEqual("test");
      expect(API.post).toHaveBeenCalledWith("EntitiesApi", "/formats", {
        body: { description: "test", name: "test" },
      });
    });
  });

  describe("deleteFormat", () => {
    it("deletes a format with the API", async () => {
      API.del = jest.fn();
      await AWSService.deleteFormat("test");
      expect(API.del).toHaveBeenCalledWith("EntitiesApi", "/formats/test", {});
    });
  });
});
