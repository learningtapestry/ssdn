import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { buildConnection } from "../../test-support/factories";
import { fakeAws, fakeImpl } from "../../test-support/jest-helper";
import NucleusMetadataService from "../services/nucleus-metadata-service";
import DynamoConnectionRepository from "./dynamo-connection-repository";

const fakeMetadataService = fakeImpl<NucleusMetadataService>({
  getMetadataValue: jest.fn((k: string) =>
    k === "NucleusConnectionsTable"
      ? Promise.resolve({ value: "NucleusConnections" })
      : Promise.reject(new Error("Does not exist")),
  ),
});

const fakeDocumentClient = fakeAws<DocumentClient>({
  get: jest.fn((params: any) =>
    params.Key.endpoint === "https://test.com" && params.TableName === "NucleusConnections"
      ? Promise.resolve({ Item: buildConnection({ endpoint: "https://test.com" }) })
      : Promise.resolve({}),
  ),
  put: jest.fn(),
  scan: jest.fn(),
});

describe("DynamoConnectionRepository", () => {
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
        TableName: "NucleusConnections",
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
        TableName: "NucleusConnections",
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

  describe("put", () => {
    it("inserts a connection updating its create and update time", async () => {
      const connectionRepository = new DynamoConnectionRepository(
        fakeMetadataService,
        fakeDocumentClient,
      );
      await connectionRepository.put(buildConnection({ creationDate: "", updateDate: "" }));
      const item = fakeDocumentClient.impl.put!.mock.calls[0][0].Item;
      expect(new Date(item.creationDate).getTime()).toBeGreaterThan(0);
      expect(new Date(item.updateDate).getTime()).toBeGreaterThan(0);
    });
  });
});
