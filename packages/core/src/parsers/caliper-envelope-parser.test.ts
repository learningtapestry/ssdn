import { APIGatewayProxyEvent } from "aws-lambda";
import clone from "lodash/fp/clone";

import caliperSSDNEvent from "../../test-support/data-samples/caliper-ssdn-event.json";
import caliperJson from "../../test-support/data-samples/caliper.json";
import apiGatewayCaliperEvent from "../../test-support/lambda-events/post-caliper-envelope-event.json";
import CaliperEnvelopeParser from "./caliper-envelope-parser";

describe("CaliperEnvelopeParser", () => {
  describe("parse", () => {
    it("generates a ssdn event structured object", async () => {
      const ssdnEvent = new CaliperEnvelopeParser(
        (apiGatewayCaliperEvent as unknown) as APIGatewayProxyEvent,
        "ssdn-test.learningtapestry.com",
      ).parse();

      expect(ssdnEvent).toEqual(caliperSSDNEvent);
    });

    it("allows user to specify a custom namespace", async () => {
      const customNamespaceEvent = {
        ...apiGatewayCaliperEvent,
        headers: {
          ...apiGatewayCaliperEvent.headers,
          "X-SSDN-Namespace": "custom.learningtapestry.com",
        },
      };
      const ssdnEvent = new CaliperEnvelopeParser(
        (customNamespaceEvent as unknown) as APIGatewayProxyEvent,
        "ssdn-test.learningtapestry.com",
      ).parse();

      expect(ssdnEvent.event.namespace).toEqual("custom.learningtapestry.com");
    });

    it("decodes content when base64 flag is set", async () => {
      const unencodedEventInput = clone(apiGatewayCaliperEvent);
      unencodedEventInput.body = Buffer.from(JSON.stringify(caliperJson)).toString("base64");
      unencodedEventInput.isBase64Encoded = true;

      const ssdnEvent = new CaliperEnvelopeParser(
        (unencodedEventInput as unknown) as APIGatewayProxyEvent,
        "ssdn-test.learningtapestry.com",
      ).parse();

      expect(ssdnEvent.content).toEqual(caliperJson);
    });
  });
});
