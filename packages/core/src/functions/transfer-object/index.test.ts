import { Context } from "aws-lambda";

import { buildConnection, buildEvent, buildEventMetadata } from "../../../test-support/factories";
import { mocked } from "../../../test-support/jest-helper";
import { getConnectionRepository, getS3TransferService } from "../../services";
import { handler } from "./";

jest.mock("../../services", () => {
  const connectionRepo = {
    get: jest.fn(),
  };

  const s3TransferService = {
    transferObject: jest.fn(),
  };

  const exports = {
    getConnectionRepository: jest.fn(() => connectionRepo),
    getS3TransferService: jest.fn(() => s3TransferService),
  };

  (exports.getConnectionRepository as any).impl = connectionRepo;
  (exports.getS3TransferService as any).impl = s3TransferService;

  return exports;
});

const fakeConnectionRepo = (getConnectionRepository as any).impl;
const fakeS3TransferService = (getS3TransferService as any).impl;

describe("TransferObjectFunction", () => {
  beforeEach(() => jest.clearAllMocks());
  it("decodes s3 events and transfers the objects they reference", async () => {
    const httpEvent = buildEvent({
      event: buildEventMetadata({ protocol: "HTTPS" }),
      source: { endpoint: "https://blue.com" },
    });
    const s3ExternalEvent = buildEvent({
      content: "transfer.csv",
      event: buildEventMetadata({ protocol: "S3" }),
      source: { endpoint: "https://blue.com" },
    });
    const s3InternalEvent = buildEvent({
      content: "donttransfer.csv",
      event: buildEventMetadata({ protocol: "S3" }),
    });
    const records = [httpEvent, s3ExternalEvent, s3InternalEvent].map((e) => ({
      kinesis: { data: Buffer.from(JSON.stringify(e)).toString("base64") },
    }));
    const connection = buildConnection({ endpoint: "https://blue.com" });
    mocked(fakeConnectionRepo.get).mockResolvedValueOnce(connection);

    await handler({ Records: records } as any, {} as Context, () => {});

    expect(fakeConnectionRepo.get).toHaveBeenCalledWith("https://blue.com");
    expect(fakeS3TransferService.transferObject).toHaveBeenCalledTimes(1);
    expect(fakeS3TransferService.transferObject).toHaveBeenCalledWith(connection, s3ExternalEvent);
  });
});
