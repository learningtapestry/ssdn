import { SQSRecord } from "aws-lambda";
import sqsMessageSSDNEvent from "../../test-support/data-samples/sqs-message-ssdn-event.json";
import sqsEventInput from "../../test-support/lambda-events/process-sqs-message-event.json";
import SQSEventParser from "./sqs-event-parser";

describe("SQSEventParser", () => {
  describe("parse", () => {
    it("generates an ssdn event structured object", async () => {
      const record = (sqsEventInput.Records[0] as unknown) as SQSRecord;
      const ssdnEvent = new SQSEventParser(record, "ssdn-test.learningtapestry.com").parse();

      expect(ssdnEvent).toEqual(sqsMessageSSDNEvent);
    });
  });
});
