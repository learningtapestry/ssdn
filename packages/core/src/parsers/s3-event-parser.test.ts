import { S3EventRecord } from "aws-lambda";
import fileTransferNucleusEvent from "../../test-support/data-samples/file-transfer-nucleus-event.json";
import s3EventInput from "../../test-support/lambda-events/process-upload-event.json";
import S3EventParser from "./s3-event-parser";

describe("S3EventParser", () => {
  describe("parse", () => {
    it("generates a nucleus event structured object", async () => {
      const nucleusEvent = new S3EventParser((s3EventInput
        .Records[0] as unknown) as S3EventRecord).parse();

      expect(nucleusEvent).toEqual(fileTransferNucleusEvent);
    });
  });
});
