import API from "@aws-amplify/api";
import ApiGateway from "aws-sdk/clients/apigateway";
import CloudFormation from "aws-sdk/clients/cloudformation";
import CloudWatchLogs from "aws-sdk/clients/cloudwatchlogs";
import CognitoIdentityServiceProvider from "aws-sdk/clients/cognitoidentityserviceprovider";
import DynamoDB from "aws-sdk/clients/dynamodb";
import Lambda from "aws-sdk/clients/lambda";
import SQS from "aws-sdk/clients/sqs";
import { buildFormat } from "../../test-support/factories";
import * as factories from "../../test-support/factories";
import * as responses from "../../test-support/service-responses";
import { mockWithPromise } from "../../test-support/test-helper";
import { nullConnectionRequest } from "../app-helper";
import awsconfiguration from "../aws-configuration";
import AWSService from "./aws-service";

describe("AWSService", () => {
  const lambda = new Lambda();
  const sqs = new SQS();
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
        TableName: awsconfiguration.Storage.ssdnIncomingConnectionRequests,
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
        TableName: awsconfiguration.Storage.ssdnConnectionRequests,
      });
    });
  });

  describe("retrieveStreams", () => {
    const mockFormats = [
      {
        endpoint: "https://ssdn.adam.acme.org/",
        format: "xAPI",
        namespace: "ssdn.ajax.org",
        status: "active",
      },
      {
        endpoint: "https://ssdn.jonah.acme.org/",
        format: "xAPI",
        namespace: "ssdn.ajax.org",
        status: "paused",
      },
      {
        endpoint: "https://ssdn.mickey.acme.org/",
        format: "xAPI",
        namespace: "ssdn.ajax.org",
        status: "paused_external",
      },
    ];
    const mockOutputFormats = [
      { ...mockFormats[0], namespace: "ssdn.adam.acme.org" },
      { ...mockFormats[1], namespace: "ssdn.jonah.acme.org" },
      { ...mockFormats[2], namespace: "ssdn.mickey.acme.org" },
    ];

    it("finds inputs", async () => {
      DynamoDB.DocumentClient.prototype.scan = mockWithPromise(responses.connections());
      const streams = await AWSService.retrieveStreams("input");
      expect(streams).toEqual(mockFormats);
      expect(DynamoDB.DocumentClient.prototype.scan).toHaveBeenCalledWith({
        FilterExpression: "attribute_exists(inputStreams[0])",
        TableName: awsconfiguration.Storage.ssdnConnections,
      });
    });

    it("finds outputs", async () => {
      DynamoDB.DocumentClient.prototype.scan = mockWithPromise(responses.connections());
      const streams = await AWSService.retrieveStreams("output");
      expect(streams).toEqual(mockOutputFormats);
      expect(DynamoDB.DocumentClient.prototype.scan).toHaveBeenCalledWith({
        FilterExpression: "attribute_exists(outputStreams[0])",
        TableName: awsconfiguration.Storage.ssdnConnections,
      });
    });
  });

  describe("retrieveStack", () => {
    it("retrieves the available stacks and return instances", async () => {
      CloudFormation.prototype.describeStacks = mockWithPromise(responses.cloudFormationStacks());
      const currentStack = await AWSService.retrieveStack();
      expect(currentStack).toEqual(factories.ssdnStack);
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
        "/aws/lambda/SSDN-AuthorizeBeaconFunction-1P2GO4YF9VZA7",
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
      const format = await AWSService.updateFormat(
        buildFormat({ name: "test", description: "test" }),
      );
      expect(format.name).toEqual("test");
      expect(API.patch).toHaveBeenCalledWith("EntitiesApi", "/formats/test", {
        body: { description: "test", name: "test", creationDate: "", updateDate: "" },
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

  describe("retrieveApiKey", () => {
    it("retrieves the api key by its id", async () => {
      ApiGateway.prototype.getApiKey = mockWithPromise(responses.apiKey());
      const apiKey = await AWSService.retrieveApiKey("okothmfzma");

      expect(apiKey).toEqual("K4I8vkxjRz3OUZ8HBPKdS9Y8hCIh4fjY5F4JPFfn");
    });
  });

  describe("retrieveFileTransferNotifications", () => {
    it("retrieves file transfer notifications from the API", async () => {
      API.get = jest.fn();
      await AWSService.retrieveFileTransferNotifications();

      expect(API.get).toHaveBeenCalledWith(
        "FileTransferNotificationsApi",
        "/file-transfers/notifications",
        {},
      );
    });
  });

  describe("deleteFileTransferNotification", () => {
    it("deletes a file transfer notification with the API", async () => {
      API.del = jest.fn();
      await AWSService.deleteFileTransferNotification("6e6e94dd-aa5e-47bb-a2df-7f21cafed71e");

      expect(API.del).toHaveBeenCalledWith(
        "FileTransferNotificationsApi",
        "/file-transfers/notifications/6e6e94dd-aa5e-47bb-a2df-7f21cafed71e",
        {},
      );
    });
  });

  describe("retrieveSQSIntegrationFunction", () => {
    it("retrieves the ARN of the SQS lambda", async () => {
      AWSService.retrieveStack = jest.fn().mockResolvedValue(factories.ssdnStack);

      const integrationFunction = await AWSService.retrieveSQSIntegrationFunction();

      expect(integrationFunction).toEqual(
        "arn:aws:lambda:us-east-1:111111111111:function:SSDN-ProcessSQSMessageFunction-18XOSMJC66JZK",
      );
    });
  });

  describe("retrieveQueues", () => {
    it("retrieves the SQS queues", async () => {
      sqs.listQueues = mockWithPromise(responses.queues());
      sqs.getQueueAttributes = jest
        .fn()
        .mockReturnValueOnce({ promise: async () => responses.queueAttributes() })
        .mockReturnValueOnce({
          promise: async () => responses.queueAttributes("ssdn-another-queue"),
        });

      const logEvents = await AWSService.retrieveQueues(sqs);

      expect(logEvents).toEqual(factories.queueArns());
    });
  });

  describe("retrieveQueueMappings", () => {
    it("retrieves the source event mappings for the SQS lambda", async () => {
      lambda.listEventSourceMappings = mockWithPromise(responses.queueMappings());
      AWSService.retrieveSQSIntegrationFunction = jest
        .fn()
        .mockResolvedValue(
          "arn:aws:lambda:us-east-1:111111111111:function:SSDN-ProcessSQSMessageFunction-18XOSMJC66JZK",
        );

      const queueMappings = await AWSService.retrieveQueueMappings(lambda);

      expect(queueMappings).toEqual(factories.queueMappings());
    });
  });

  describe("retrieveSQSIntegrationNamespace", () => {
    it("retrieves the current namespace for the SQS lambda function", async () => {
      AWSService.retrieveSQSIntegrationConfig = jest
        .fn()
        .mockResolvedValue(responses.functionConfiguration());

      const namespace = await AWSService.retrieveSQSIntegrationNamespace();

      expect(namespace).toEqual("test.example.com");
    });
  });

  describe("updateNamespace", () => {
    it("updates the namespace variable without affecting the others", async () => {
      AWSService.retrieveSQSIntegrationFunction = jest
        .fn()
        .mockResolvedValue(
          "arn:aws:lambda:us-east-1:111111111111:function:SSDN-ProcessSQSMessageFunction-18XOSMJC66JZK",
        );
      AWSService.retrieveSQSIntegrationConfig = jest
        .fn()
        .mockResolvedValue(responses.functionConfiguration());
      lambda.updateFunctionConfiguration = mockWithPromise(undefined);

      await AWSService.updateNamespace("modified.example.com", lambda);

      expect(lambda.updateFunctionConfiguration).toHaveBeenCalledWith({
        Environment: {
          Variables: {
            SSDN_AWS_ACCOUNT_ID: "111111111111",
            SSDN_ENVIRONMENT: "Development",
            SSDN_ID: "learning-tapestry-dev",
            SSDN_LOG_LEVEL: "info",
            SSDN_NAMESPACE: "modified.example.com",
            SSDN_STACK_ID:
              "arn:aws:cloudformation:us-east-1:111111111111:stack/SSDN/00390200-a309-11e9-99ba-12ff035a5bdc",
            SSDN_STACK_NAME: "SSDN",
          },
        },
        FunctionName:
          "arn:aws:lambda:us-east-1:111111111111:function:SSDN-ProcessSQSMessageFunction-18XOSMJC66JZK",
      });
    });
  });
});
