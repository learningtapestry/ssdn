import { APIGatewayProxyEvent } from "aws-lambda";
import clone from "lodash/fp/clone";

import nucleusEventSample from "../../test-support/data-samples/nucleus-event.json";
import processEventInput from "../../test-support/lambda-events/put-xapi-statement-event.json";
import XAPIStatementParser from "./xapi-statement-parser";

describe("XAPIStatementParser", () => {
  describe("parse", () => {
    it("generates a nucleus event structured object", async () => {
      const nucleusEvent = new XAPIStatementParser(
        (processEventInput as unknown) as APIGatewayProxyEvent,
        "nucleus-test.learningtapestry.com",
      ).parse();

      expect(nucleusEvent).toEqual(nucleusEventSample);
    });

    it("allows user to specify a custom namespace", async () => {
      const customNamespaceEvent = {
        ...processEventInput,
        headers: {
          ...processEventInput.headers,
          "X-Nucleus-Namespace": "custom.learningtapestry.com",
        },
      };
      const nucleusEvent = new XAPIStatementParser(
        (customNamespaceEvent as unknown) as APIGatewayProxyEvent,
        "nucleus-test.learningtapestry.com",
      ).parse();

      expect(nucleusEvent.event.namespace).toEqual("custom.learningtapestry.com");
    });

    it("does not try to decode content when flag is not set", async () => {
      const unencodedEventInput = clone(processEventInput);
      unencodedEventInput.body = JSON.stringify({
        content: "My content",
        id: "5030ba19-5d5b-43be-998f-cfcd530c1a09",
      });
      unencodedEventInput.isBase64Encoded = false;

      const nucleusEvent = new XAPIStatementParser(
        (unencodedEventInput as unknown) as APIGatewayProxyEvent,
        "nucleus-test.learningtapestry.com",
      ).parse();

      expect(nucleusEvent.content).toHaveProperty("content", "My content");
      expect(nucleusEvent.content).toHaveProperty("id", "5030ba19-5d5b-43be-998f-cfcd530c1a09");
    });

    it("generates an UUID when none is provided", async () => {
      const unencodedEventInput = processEventInput;
      unencodedEventInput.body = JSON.stringify({
        content: "My content",
      });
      unencodedEventInput.isBase64Encoded = false;

      const nucleusEvent = new XAPIStatementParser(
        (processEventInput as unknown) as APIGatewayProxyEvent,
        "nucleus-test.learningtapestry.com",
      ).parse();

      expect(nucleusEvent.content).toHaveProperty("content", "My content");
      expect(nucleusEvent.content).toHaveProperty("id");
    });
  });
});
