import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { buildConnection } from "../../test-support/factories";
import { fakeAws, fakeImpl } from "../../test-support/jest-helper";
import SSDNMetadataService from "../services/ssdn-metadata-service";
import DynamoConnectionRepository from "./dynamo-connection-repository";

const fakeMetadataService = fakeImpl<SSDNMetadataService>({
  getMetadataValue: jest.fn((k: string) =>
    k === "SSDNConnectionsTable"
      ? Promise.resolve({ value: "SSDNConnections" })
      : Promise.reject(new Error("Does not exist")),
  ),
});

const fakeDocumentClient = fakeAws<DocumentClient>({
  get: jest.fn((params: any) =>
    params.Key.endpoint === "https://test.com" && params.TableName === "SSDNConnections"
      ? Promise.resolve({ Item: buildConnection({ endpoint: "https://test.com" }) })
      : Promise.resolve({}),
  ),
  put: jest.fn(),
  scan: jest.fn(),
});

describe("DynamoConnectionRepository", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("findAllWithOutputStreams", () => {
    it("finds connections with output streams", async () => {
      const connectionRepository = new DynamoConnectionRepository(
        fakeMetadataService,
        fakeDocumentClient,
      );
      fakeDocumentClient.impl.scan!.mockImplementationOnce(() =>
        Promise.resolve({
          Items: [
            buildConnection({ endpoint: "https://test.com" }),
            buildConnection({ endpoint: "https://test2.com" }),
          ],
        }),
      );
      const result = await connectionRepository.findAllWithOutputStreams();
      expect(result[0].endpoint).toEqual("https://test.com");
      expect(result[1].endpoint).toEqual("https://test2.com");
      expect(fakeDocumentClient.impl.scan!).toHaveBeenCalledWith({
        FilterExpression: `attribute_exists(outputStreams[0])`,
        TableName: "SSDNConnections",
      });
    });

    it("returns an empty array when nothing is found", async () => {
      const connectionRepository = new DynamoConnectionRepository(
        fakeMetadataService,
        fakeDocumentClient,
      );
      fakeDocumentClient.impl.scan!.mockImplementationOnce(() =>
        Promise.resolve({
          Items: [],
        }),
      );
      const result = await connectionRepository.findAllWithOutputStreams();
      expect(result).toEqual([]);
    });
  });

  describe("get", () => {
    it("finds a connection by endpoint", async () => {
      const connectionRepository = new DynamoConnectionRepository(
        fakeMetadataService,
        fakeDocumentClient,
      );

      const connection = await connectionRepository.get("https://test.com");
      expect(connection.endpoint).toEqual("https://test.com");
      expect(fakeDocumentClient.impl.get!).toHaveBeenCalledWith({
        Key: {
          endpoint: "https://test.com",
        },
        TableName: "SSDNConnections",
      });
    });

    it("throws an error when connection isn't found", async () => {
      const connectionRepository = new DynamoConnectionRepository(
        fakeMetadataService,
        fakeDocumentClient,
      );

      const result = connectionRepository.get("https://testfail.com");
      await expect(result).rejects.toHaveProperty(
        "message",
        'Item {"endpoint":"https://testfail.com"} not found.',
      );
    });
  });

  describe("getByConnectionSecret", () => {
    it("queries by connection role name", async () => {
      const connectionRepository = new DynamoConnectionRepository(
        fakeMetadataService,
        fakeDocumentClient,
      );
      fakeDocumentClient.impl.scan!.mockImplementationOnce(() =>
        Promise.resolve({
          Items: [buildConnection({ endpoint: "https://test.com" })],
        }),
      );
      const result = await connectionRepository.getByConnectionSecret("test");
      expect(result).toEqual(buildConnection({ endpoint: "https://test.com" }));
      expect(fakeDocumentClient.impl.scan!).toHaveBeenCalledWith({
        ExpressionAttributeNames: {
          "#connection": "connection",
          "#roleName": "roleName",
        },
        ExpressionAttributeValues: {
          ":roleName": "test",
        },
        FilterExpression: "#connection.#roleName = :roleName",
        TableName: "SSDNConnections",
      });
    });

    it("throws when nothing is found", async () => {
      const connectionRepository = new DynamoConnectionRepository(
        fakeMetadataService,
        fakeDocumentClient,
      );
      fakeDocumentClient.impl.scan!.mockResolvedValue({ Items: [] });
      const result = connectionRepository.getByConnectionSecret("test");
      await expect(result).rejects.toHaveProperty("message", "Role not found: test");
    });
  });

  describe("put", () => {
    it("inserts a connection updating its create and update time", async () => {
      const connectionRepository = new DynamoConnectionRepository(
        fakeMetadataService,
        fakeDocumentClient,
      );
      await connectionRepository.put(
        buildConnection({ creationDate: "", endpoint: "https://red.com", updateDate: "" }),
      );
      const item = fakeDocumentClient.impl.put!.mock.calls[0][0].Item;
      expect(new Date(item.creationDate).getTime()).toBeGreaterThan(0);
      expect(new Date(item.updateDate).getTime()).toBeGreaterThan(0);
    });

    it("inserts a connection updating its create and update time", async () => {
      const connectionRepository = new DynamoConnectionRepository(
        fakeMetadataService,
        fakeDocumentClient,
      );

      for (const badUrl of ["javascript:alert(1)", "failsvalidation", "localhost:1234"]) {
        const result = connectionRepository.put(buildConnection({ endpoint: badUrl }));
        await expect(result).rejects.toHaveProperty(
          "message",
          "The endpoint for the connection is not valid.",
        );
      }
    });
  });
});
