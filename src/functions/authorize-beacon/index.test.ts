import { Context } from "aws-lambda";

import { createApiKey } from "../../../test-support/aws";
import beaconEvent from "../../../test-support/lambda-events/beacon-authorizer-event.json";
import { handler } from "./index";

describe("AuthorizeBeaconFunction", () => {
  it("allows access for a request with a valid api key", async () => {
    const gatewayKey = await createApiKey();

    const event = {
      ...beaconEvent,
      queryStringParameters: {
        aid: gatewayKey.id!,
      },
    };

    const result = await handler(event, {} as Context, () => {
      // Do nothing
    });

    expect((result as any).usageIdentifierKey).toEqual(gatewayKey.value);
    expect((result as any).policyDocument.Statement[0].Effect).toEqual("Allow");
    expect((result as any).policyDocument.Statement[0].Resource).toEqual(beaconEvent.methodArn);
  });

  it("denies access for a request with a disabled key", async () => {
    const gatewayKey = await createApiKey(false);

    const event = {
      ...beaconEvent,
      queryStringParameters: {
        aid: gatewayKey.id!,
      },
    };

    const result = await handler(event, {} as Context, () => {
      // Do nothing
    });

    expect((result as any).usageIdentifierKey).toEqual(gatewayKey.value);
    expect((result as any).policyDocument.Statement[0].Effect).toEqual("Deny");
    expect((result as any).policyDocument.Statement[0].Resource).toEqual(beaconEvent.methodArn);
  });

  it("denies access for a request with an invalid key", async () => {
    const event = {
      ...beaconEvent,
      queryStringParameters: {
        aid: "```",
      },
    };

    const result = await handler(event, {} as Context, () => {
      // Do nothing
    });

    expect((result as any).usageIdentifierKey).toEqual("");
    expect((result as any).policyDocument.Statement[0].Effect).toEqual("Deny");
    expect((result as any).policyDocument.Statement[0].Resource).toEqual(beaconEvent.methodArn);
  });

  it("denies access for a request with a key that doesnt exist", async () => {
    const event = {
      ...beaconEvent,
      queryStringParameters: {
        aid: "a1b2c3d4e5",
      },
    };

    const result = await handler(event, {} as Context, () => {
      // Do nothing
    });

    expect((result as any).usageIdentifierKey).toEqual("");
    expect((result as any).policyDocument.Statement[0].Effect).toEqual("Deny");
    expect((result as any).policyDocument.Statement[0].Resource).toEqual(beaconEvent.methodArn);
  });
});
