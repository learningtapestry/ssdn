import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { fakeAws } from "../../test-support/jest-helper";
import { getOrFail } from "./dynamo-helper";

const fakeDocumentClient = fakeAws<DocumentClient>({
  get: jest.fn((params: any) =>
    params.Key.id === "1" && params.TableName === "Test"
      ? Promise.resolve({ Item: { id: 1 } })
      : Promise.resolve({ Item: undefined }),
  ),
});

describe("getOrFail", () => {
  it("returns item when one is found", async () => {
    const result = getOrFail(fakeDocumentClient, { id: "1" }, "Test");
    await expect(result).resolves.toEqual({ id: 1 });
  });

  it("throws ssdn error when none is found", async () => {
    const result = getOrFail(fakeDocumentClient, { id: "2" }, "Test");
    await expect(result).rejects.toBeTruthy();
    await expect(result).rejects.toHaveProperty("message", 'Item {"id":"2"} not found.');
  });
});
