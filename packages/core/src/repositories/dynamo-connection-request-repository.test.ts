import { DocumentClient } from "aws-sdk/clients/dynamodb";
import isoRegex from "regex-iso-date";

import { buildConnectionRequest } from "../../test-support/factories";
import { fakeAws, fakeImpl, mocked } from "../../test-support/jest-helper";
import { ConnectionRequestStatus } from "../interfaces/connection-request";
import NucleusMetadataService from "../services/nucleus-metadata-service";
import DynamoConnectionRequestRepository from "./dynamo-connection-request-repository";

const fakeMetadataService = fakeImpl<NucleusMetadataService>({
  getMetadataValue: jest.fn((k: string) => {
    const values: any = {
      NucleusConnectionRequestsTable: "NucleusConnectionRequests",
      NucleusIncomingConnectionRequestsTable: "NucleusIncomingConnectionRequests",
    };
    return values[k]
      ? Promise.resolve({ value: values[k] })
      : Promise.reject(new Error("Does not exist"));
  }),
});

const fakeDocumentClient = fakeAws<DocumentClient>({
  get: jest.fn((params: any) => {
    const data: any = {
      NucleusConnectionRequests: {
        "1": buildConnectionRequest({ id: "1", providerEndpoint: "https://testdest.com" }),
      },
      NucleusIncomingConnectionRequests: {
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
        TableName: "NucleusConnectionRequests",
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
        TableName: "NucleusIncomingConnectionRequests",
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

      await connReqRepo.put(buildConnectionRequest());
      expect(mocked(fakeDocumentClient.put).mock.calls[0][0]).toMatchObject({
        Item: {
          creationDate: expect.stringMatching(isoRegex()),
        },
        TableName: "NucleusConnectionRequests",
      });
    });
  });

  describe("putIncoming", () => {
    it("inserts/replaces an incoming connection request", async () => {
      const connReqRepo = new DynamoConnectionRequestRepository(
        fakeMetadataService,
        fakeDocumentClient,
      );

      await connReqRepo.putIncoming(buildConnectionRequest());
      expect(mocked(fakeDocumentClient.put).mock.calls[0][0]).toMatchObject({
        Item: {
          creationDate: expect.stringMatching(isoRegex()),
        },
        TableName: "NucleusIncomingConnectionRequests",
      });
    });
  });
});
