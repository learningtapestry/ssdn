import { DocumentClient } from "aws-sdk/clients/dynamodb";
import isoRegex from "regex-iso-date";

import { buildConnectionRequest } from "../../test-support/factories";
import { fakeAws, fakeImpl, mocked } from "../../test-support/jest-helper";
import { ConnectionRequestStatus } from "../interfaces/connection-request";
import SSDNMetadataService from "../services/ssdn-metadata-service";
import DynamoConnectionRequestRepository from "./dynamo-connection-request-repository";

const fakeMetadataService = fakeImpl<SSDNMetadataService>({
  getMetadataValue: jest.fn((k: string) => {
    const values: any = {
      SSDNConnectionRequestsTable: "SSDNConnectionRequests",
      SSDNIncomingConnectionRequestsTable: "SSDNIncomingConnectionRequests",
    };
    return values[k]
      ? Promise.resolve({ value: values[k] })
      : Promise.reject(new Error("Does not exist"));
  }),
});

const fakeDocumentClient = fakeAws<DocumentClient>({
  get: jest.fn((params: any) => {
    const data: any = {
      SSDNConnectionRequests: {
        "1": buildConnectionRequest({ id: "1", providerEndpoint: "https://testdest.com" }),
      },
      SSDNIncomingConnectionRequests: {
        "1.https://testsrc.com": buildConnectionRequest({
          consumerEndpoint: "https://testsrc.com",
          id: "1",
        }),
      },
    };
    return Promise.resolve({
      Item:
        data[params.TableName][
          params.Key.consumerEndpoint
            ? `${params.Key.id}.${params.Key.consumerEndpoint}`
            : params.Key.id
        ],
    });
  }),
  put: jest.fn(),
  update: jest.fn(),
});

describe("DynamoConnectionRequestRepository", () => {
  beforeEach(() => {
    mocked(fakeDocumentClient.update).mockClear();
    mocked(fakeDocumentClient.put).mockClear();
  });

  describe("get", () => {
    it("finds a connection request", async () => {
      const connReqRepo = new DynamoConnectionRequestRepository(
        fakeMetadataService,
        fakeDocumentClient,
      );

      const connReq = await connReqRepo.get("1");
      expect(connReq.providerEndpoint).toEqual("https://testdest.com");
    });

    it("throws when nothing is found", async () => {
      const connReqRepo = new DynamoConnectionRequestRepository(
        fakeMetadataService,
        fakeDocumentClient,
      );

      const result = connReqRepo.get("2");
      await expect(result).rejects.toHaveProperty("message", 'Item {"id":"2"} not found.');
    });
  });

  describe("getIncoming", () => {
    it("finds an incoming connection request", async () => {
      const connReqRepo = new DynamoConnectionRequestRepository(
        fakeMetadataService,
        fakeDocumentClient,
      );

      const connReq = await connReqRepo.getIncoming("https://testsrc.com", "1");
      expect(connReq.consumerEndpoint).toEqual("https://testsrc.com");
    });

    it("throws when nothing is found", async () => {
      const connReqRepo = new DynamoConnectionRequestRepository(
        fakeMetadataService,
        fakeDocumentClient,
      );

      const result = connReqRepo.getIncoming("https://testsrc.com", "2");
      await expect(result).rejects.toHaveProperty(
        "message",
        'Item {"consumerEndpoint":"https://testsrc.com","id":"2"} not found.',
      );
    });
  });

  describe("updateStatus", () => {
    it("updates the status of a request", async () => {
      const connReqRepo = new DynamoConnectionRequestRepository(
        fakeMetadataService,
        fakeDocumentClient,
      );

      await connReqRepo.updateStatus("1", ConnectionRequestStatus.Accepted);
      expect(fakeDocumentClient.update).toHaveBeenCalledWith({
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": "accepted",
        },
        Key: {
          id: "1",
        },
        TableName: "SSDNConnectionRequests",
        UpdateExpression: "SET #status = :status",
      });
    });
  });

  describe("updateIncomingStatus", () => {
    it("updates the status of an incoming request", async () => {
      const connReqRepo = new DynamoConnectionRequestRepository(
        fakeMetadataService,
        fakeDocumentClient,
      );

      await connReqRepo.updateIncomingStatus(
        "https://testsrc.com",
        "1",
        ConnectionRequestStatus.Accepted,
      );
      expect(fakeDocumentClient.update).toHaveBeenCalledWith({
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": "accepted",
        },
        Key: {
          consumerEndpoint: "https://testsrc.com",
          id: "1",
        },
        TableName: "SSDNIncomingConnectionRequests",
        UpdateExpression: "SET #status = :status",
      });
    });
  });

  describe("put", () => {
    it("inserts/replaces a connection request", async () => {
      const connReqRepo = new DynamoConnectionRequestRepository(
        fakeMetadataService,
        fakeDocumentClient,
      );

      await connReqRepo.put(
        buildConnectionRequest({
          consumerEndpoint: "https://red.com",
          providerEndpoint: "https://blue.com",
        }),
      );
      expect(mocked(fakeDocumentClient.put).mock.calls[0][0]).toMatchObject({
        Item: {
          creationDate: expect.stringMatching(isoRegex()),
        },
        TableName: "SSDNConnectionRequests",
      });
    });

    it("validates the URL", async () => {
      const connReqRepo = new DynamoConnectionRequestRepository(
        fakeMetadataService,
        fakeDocumentClient,
      );

      for (const badUrl of ["javascript:alert(1)", "failsvalidation", "localhost:1234"]) {
        const result = connReqRepo.put(buildConnectionRequest({ consumerEndpoint: badUrl }));
        await expect(result).rejects.toHaveProperty(
          "message",
          "The endpoint for the connection is not valid.",
        );
      }

      for (const badUrl of ["javascript:alert(1)", "failsvalidation", "localhost:1234"]) {
        const result = connReqRepo.put(buildConnectionRequest({ providerEndpoint: badUrl }));
        await expect(result).rejects.toHaveProperty(
          "message",
          "The endpoint for the connection is not valid.",
        );
      }
    });
  });

  describe("putIncoming", () => {
    it("inserts/replaces an incoming connection request", async () => {
      const connReqRepo = new DynamoConnectionRequestRepository(
        fakeMetadataService,
        fakeDocumentClient,
      );

      await connReqRepo.putIncoming(
        buildConnectionRequest({
          consumerEndpoint: "https://red.com",
          providerEndpoint: "https://blue.com",
        }),
      );
      expect(mocked(fakeDocumentClient.put).mock.calls[0][0]).toMatchObject({
        Item: {
          creationDate: expect.stringMatching(isoRegex()),
        },
        TableName: "SSDNIncomingConnectionRequests",
      });
    });

    it("validates the URL", async () => {
      const connReqRepo = new DynamoConnectionRequestRepository(
        fakeMetadataService,
        fakeDocumentClient,
      );

      for (const badUrl of ["javascript:alert(1)", "failsvalidation", "localhost:1234"]) {
        const result = connReqRepo.putIncoming(
          buildConnectionRequest({ consumerEndpoint: badUrl }),
        );
        await expect(result).rejects.toHaveProperty(
          "message",
          "The endpoint for the connection is not valid.",
        );
      }

      for (const badUrl of ["javascript:alert(1)", "failsvalidation", "localhost:1234"]) {
        const result = connReqRepo.putIncoming(
          buildConnectionRequest({ providerEndpoint: badUrl }),
        );
        await expect(result).rejects.toHaveProperty(
          "message",
          "The endpoint for the connection is not valid.",
        );
      }
    });
  });
});
