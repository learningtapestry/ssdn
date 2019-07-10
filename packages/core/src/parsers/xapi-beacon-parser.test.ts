import { APIGatewayProxyEvent } from "aws-lambda";

import beaconEventSample from "../../test-support/data-samples/beacon-event.json";
import beaconEventInput from "../../test-support/lambda-events/get-xapi-beacon-event.json";
import XAPIBeaconParser from "./xapi-beacon-parser";

describe("XAPIBeaconParser", () => {
  describe("parse", () => {
    it("generates a ssdn event structured object", async () => {
      const ssdnEvent = new XAPIBeaconParser(
        (beaconEventInput as unknown) as APIGatewayProxyEvent,
        "ssdn-test.learningtapestry.com",
      ).parse();

      expect(ssdnEvent).toEqual(beaconEventSample);
    });

    it("allows user to specify a custom namespace", async () => {
      const customNamespaceEvent = {
        ...beaconEventInput,
        queryStringParameters: {
          ...beaconEventInput.queryStringParameters,
          ns: "custom.learningtapestry.com",
        },
      };

      const ssdnEvent = new XAPIBeaconParser(
        (customNamespaceEvent as unknown) as APIGatewayProxyEvent,
        "ssdn-test.learningtapestry.com",
      ).parse();

      expect(ssdnEvent.event.namespace).toEqual("custom.learningtapestry.com");
    });

    it("generates an UUID when none is provided", async () => {
      const ssdnEvent = new XAPIBeaconParser(
        (beaconEventInput as unknown) as APIGatewayProxyEvent,
        "ssdn-test.learningtapestry.com",
      ).parse();

      expect(ssdnEvent.content).toHaveProperty("id");
    });
  });
});
