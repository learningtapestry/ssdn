import { Context, S3Event } from "aws-lambda";
import { fakeImpl, mocked } from "../../../test-support/jest-helper";
import processUploadEvent from "../../../test-support/lambda-events/process-upload-event.json";
import { AWS_NUCLEUS } from "../../interfaces/aws-metadata-keys";
import { getMetadataService } from "../../services";
import FileUploadService from "../../services/file-upload-service";
import NucleusMetadataService from "../../services/nucleus-metadata-service";
import { handler } from "./index";

jest.mock("../../services");

const nucleusMetadataService = fakeImpl<NucleusMetadataService>({
  getMetadataValue: jest.fn((key: string) =>
    Promise.resolve({
      value: ({
        [AWS_NUCLEUS.namespace]: "nucleus-test.learningtapestry.com",
      } as any)[key],
    }),
  ),
});

mocked(getMetadataService).mockImplementation(() => nucleusMetadataService);

const validResult = {
  SequenceNumber: "49596017907567168170237281574035826623024849082516504578",
  ShardId: "shardId-000000000000",
};

const invalidResult = { error: "Unexpected error when storing file" };

describe("ProcessUploadFunction", () => {
  it("stores a nucleus event when a file is uploaded", async () => {
    FileUploadService.process = jest.fn().mockReturnValueOnce(validResult);

    await handler((processUploadEvent as unknown) as S3Event, {} as Context, (error, result) => {
      expect(result).toEqual([validResult]);
    });
  });

  it("sets error in callback when file creation fails", async () => {
    FileUploadService.process = jest.fn().mockReturnValueOnce(invalidResult);

    await handler((processUploadEvent as unknown) as S3Event, {} as Context, (error) => {
      expect(error).toEqual([invalidResult]);
    });
  });

  describe("Multiple Upload Events", () => {
    const multiUploadEvent = {
      Records: [processUploadEvent.Records[0], processUploadEvent.Records[0]],
    };
    const anotherResult = {
      SequenceNumber: "49596017907567168170237281574037035548844645887024037890",
      ShardId: "shardId-000000000000",
    };
    const anotherError = { error: "Another unexpected error" };

    it("returns combined results for all upload events", async () => {
      FileUploadService.process = jest
        .fn()
        .mockReturnValueOnce(validResult)
        .mockReturnValueOnce(anotherResult);

      await handler(multiUploadEvent as S3Event, {} as Context, (error, result) => {
        expect(result).toEqual([validResult, anotherResult]);
      });
    });

    it("sets combined errors in callback", async () => {
      FileUploadService.process = jest
        .fn()
        .mockReturnValueOnce(invalidResult)
        .mockReturnValueOnce(anotherError);

      await handler(multiUploadEvent as S3Event, {} as Context, (error) => {
        expect(error).toEqual([invalidResult, anotherError]);
      });
    });
  });
});
