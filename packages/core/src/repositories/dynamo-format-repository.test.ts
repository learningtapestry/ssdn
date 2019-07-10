import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { buildFormat } from "../../test-support/factories";
import { fakeAws, fakeImpl } from "../../test-support/jest-helper";
import { isoDate } from "../helpers/app-helper";
import SSDNMetadataService from "../services/ssdn-metadata-service";
import DynamoFormatRepository from "./dynamo-format-repository";

const fakeMetadataService = fakeImpl<SSDNMetadataService>({
  getMetadataValue: jest.fn((k: string) =>
    k === "SSDNFormatsTable"
      ? Promise.resolve({ value: "SSDNFormats" })
      : Promise.reject(new Error("Does not exist")),
  ),
});

const fakeDocumentClient = fakeAws<DocumentClient>({
  delete: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  scan: jest.fn(),
});

describe("DynamoFormatRepository", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("findAll", () => {
    it("finds all formats, sorted by name asc", async () => {
      const formatRepository = new DynamoFormatRepository(fakeMetadataService, fakeDocumentClient);
      fakeDocumentClient.impl.scan!.mockImplementationOnce(() =>
        Promise.resolve({
          Items: [
            buildFormat({ name: "xAPI" }),
            buildFormat({ name: "Caliper" }),
            buildFormat({ name: "Test" }),
          ],
        }),
      );
      const result = await formatRepository.findAll();
      expect(result[0].name).toEqual("Caliper");
      expect(result[1].name).toEqual("Test");
      expect(result[2].name).toEqual("xAPI");
      expect(fakeDocumentClient.impl.scan!).toHaveBeenCalledWith({
        TableName: "SSDNFormats",
      });
    });

    it("returns an empty array when nothing is found", async () => {
      const formatRepository = new DynamoFormatRepository(fakeMetadataService, fakeDocumentClient);
      fakeDocumentClient.impl.scan!.mockImplementationOnce(() =>
        Promise.resolve({
          Items: [],
        }),
      );
      const result = await formatRepository.findAll();
      expect(result).toEqual([]);
    });
  });

  describe("get", () => {
    it("finds a connection by endpoint", async () => {
      const formatRepository = new DynamoFormatRepository(fakeMetadataService, fakeDocumentClient);
      fakeDocumentClient.impl.get!.mockResolvedValueOnce({ Item: buildFormat({ name: "xAPI" }) });
      const format = await formatRepository.get("xAPI");
      expect(format.name).toEqual("xAPI");
      expect(fakeDocumentClient.impl.get!).toHaveBeenCalledWith({
        Key: {
          name: "xAPI",
        },
        TableName: "SSDNFormats",
      });
    });

    it("throws an error when connection isn't found", async () => {
      const formatRepository = new DynamoFormatRepository(fakeMetadataService, fakeDocumentClient);
      fakeDocumentClient.impl.get!.mockResolvedValueOnce({});
      const result = formatRepository.get("fail");
      await expect(result).rejects.toHaveProperty("message", 'Item {"name":"fail"} not found.');
    });
  });

  describe("put", () => {
    it("inserts a format updating its create and update time", async () => {
      const formatRepository = new DynamoFormatRepository(fakeMetadataService, fakeDocumentClient);
      await formatRepository.put(buildFormat());
      const item = fakeDocumentClient.impl.put!.mock.calls[0][0].Item;
      expect(new Date(item.creationDate).getTime()).toBeGreaterThan(0);
      expect(new Date(item.updateDate).getTime()).toBeGreaterThan(0);
    });
  });

  describe("update", () => {
    it("updates a format preserving its primary key and updating timestamp", async () => {
      const format = buildFormat({ name: "name is immutable", description: "Test" });
      const then = new Date(2019, 1, 1).toISOString();
      fakeDocumentClient.impl.get!.mockResolvedValueOnce({
        Item: buildFormat({ name: "test", creationDate: then, updateDate: then }),
      });
      const formatRepository = new DynamoFormatRepository(fakeMetadataService, fakeDocumentClient);
      const newFormat = await formatRepository.update("test", format);
      expect(newFormat.name).toEqual("test");
      expect(newFormat.description).toEqual("Test");
      expect(newFormat.creationDate).toEqual(then);
      expect(new Date(newFormat.updateDate).getTime()).toBeGreaterThan(new Date(then).getTime());
      expect(fakeDocumentClient.impl.put!).toHaveBeenCalledWith({
        Item: {
          creationDate: expect.anything(),
          description: "Test",
          name: "test",
          updateDate: expect.anything(),
        },
        TableName: "SSDNFormats",
      });
    });
  });

  describe("delete", () => {
    it("deletes a format", async () => {
      fakeDocumentClient.impl.get!.mockResolvedValueOnce({ Item: buildFormat({ name: "xAPI" }) });
      const formatRepository = new DynamoFormatRepository(fakeMetadataService, fakeDocumentClient);
      await formatRepository.delete("xAPI");

      // It tries to find the format before deleting
      expect(fakeDocumentClient.impl.get!).toHaveBeenCalledWith({
        Key: {
          name: "xAPI",
        },
        TableName: "SSDNFormats",
      });

      expect(fakeDocumentClient.impl.delete!).toHaveBeenCalledWith({
        Key: {
          name: "xAPI",
        },
        TableName: "SSDNFormats",
      });
    });
  });
});
