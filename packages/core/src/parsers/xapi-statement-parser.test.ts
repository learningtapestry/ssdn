import { APIGatewayProxyEvent } from "aws-lambda";
import clone from "lodash/fp/clone";

import ssdnEventSample from "../../test-support/data-samples/ssdn-event.json";
import processEventInput from "../../test-support/lambda-events/put-xapi-statement-event.json";
import XAPIStatementParser from "./xapi-statement-parser";

describe("XAPIStatementParser", () => {
  describe("parse", () => {
    it("generates a ssdn event structured object", async () => {
      const ssdnEvent = new XAPIStatementParser(
        (processEventInput as unknown) as APIGatewayProxyEvent,
        "ssdn-test.learningtapestry.com",
      ).parse();

      expect(ssdnEvent).toEqual(ssdnEventSample);
    });

    it("allows user to specify a custom namespace", async () => {
      const customNamespaceEvent = {
        ...processEventInput,
        headers: {
          ...processEventInput.headers,
          "X-SSDN-Namespace": "custom.learningtapestry.com",
        },
      };
      const ssdnEvent = new XAPIStatementParser(
        (customNamespaceEvent as unknown) as APIGatewayProxyEvent,
        "ssdn-test.learningtapestry.com",
      ).parse();

      expect(ssdnEvent.event.namespace).toEqual("custom.learningtapestry.com");
    });

    it("does not try to decode content when flag is not set", async () => {
      const unencodedEventInput = clone(processEventInput);
      unencodedEventInput.body = JSON.stringify({
        content: "My content",
        id: "5030ba19-5d5b-43be-998f-cfcd530c1a09",
      });
      unencodedEventInput.isBase64Encoded = false;

      const ssdnEvent = new XAPIStatementParser(
        (unencodedEventInput as unknown) as APIGatewayProxyEvent,
        "ssdn-test.learningtapestry.com",
      ).parse();

      expect(ssdnEvent.content).toHaveProperty("content", "My content");
      expect(ssdnEvent.content).toHaveProperty("id", "5030ba19-5d5b-43be-998f-cfcd530c1a09");
    });

    it("generates an UUID when none is provided", async () => {
      const unencodedEventInput = processEventInput;
      unencodedEventInput.body = JSON.stringify({
        content: "My content",
      });
      unencodedEventInput.isBase64Encoded = false;

      const ssdnEvent = new XAPIStatementParser(
        (processEventInput as unknown) as APIGatewayProxyEvent,
        "ssdn-test.learningtapestry.com",
      ).parse();

      expect(ssdnEvent.content).toHaveProperty("content", "My content");
      expect(ssdnEvent.content).toHaveProperty("id");
    });
  });
});
