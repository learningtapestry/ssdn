import { S3EventRecord } from "aws-lambda";
import fileTransferSSDNEvent from "../../test-support/data-samples/file-transfer-ssdn-event.json";
import s3EventInput from "../../test-support/lambda-events/process-upload-event.json";
import S3EventParser from "./s3-event-parser";

describe("S3EventParser", () => {
  describe("parse", () => {
    it("generates a ssdn event structured object", async () => {
      const ssdnEvent = new S3EventParser((s3EventInput
        .Records[0] as unknown) as S3EventRecord).parse();

      expect(ssdnEvent).toEqual(fileTransferSSDNEvent);
    });
  });
});
