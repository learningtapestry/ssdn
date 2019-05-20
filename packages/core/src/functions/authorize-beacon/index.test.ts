import { Context } from "aws-lambda";

import { fakeImpl, mocked } from "../../../test-support/jest-helper";
import beaconEvent from "../../../test-support/lambda-events/beacon-authorizer-event.json";
import { getApiGatewayService } from "../../services";
import ApiGatewayService from "../../services/api-gateway-service";
import { handler } from "./index";

jest.mock("../../services");

const fakeApiGatewayService = fakeImpl<ApiGatewayService>({
  getApiKey: jest.fn((keyId: any) =>
    keyId.value === "123456"
      ? Promise.resolve({
          enabled: true,
          value: "a1b2c3",
        })
      : Promise.reject(),
  ),
});

mocked(getApiGatewayService).mockImplementation(() => fakeApiGatewayService);

describe("AuthorizeBeaconFunction", () => {
  it("allows access for a request with a valid api key", async () => {
    const event = {
      ...beaconEvent,
      queryStringParameters: {
        aid: "123456",
      },
    };

    const result = await handler(event, {} as Context, () => {});

    expect((result as any).usageIdentifierKey).toEqual("a1b2c3");
    expect((result as any).policyDocument.Statement[0].Effect).toEqual("Allow");
    expect((result as any).policyDocument.Statement[0].Resource).toEqual(beaconEvent.methodArn);
  });

  it("denies access for a request with a disabled key", async () => {
    mocked(fakeApiGatewayService.getApiKey).mockImplementationOnce((keyId: any) =>
      keyId.value === "654321"
        ? Promise.resolve({
            enabled: false,
            value: "a1b2c3",
          })
        : Promise.reject(),
    );

    const event = {
      ...beaconEvent,
      queryStringParameters: {
        aid: "654321",
      },
    };

    const result = await handler(event, {} as Context, () => {});

    expect((result as any).usageIdentifierKey).toEqual("a1b2c3");
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

    const result = await handler(event, {} as Context, () => {});

    expect((result as any).usageIdentifierKey).toEqual("");
    expect((result as any).policyDocument.Statement[0].Effect).toEqual("Deny");
    expect((result as any).policyDocument.Statement[0].Resource).toEqual(beaconEvent.methodArn);
  });

  it("denies access for a request with a key that doesnt exist", async () => {
    const event = {
      ...beaconEvent,
      queryStringParameters: {
        aid: "78901",
      },
    };

    const result = await handler(event, {} as Context, () => {});

    expect((result as any).usageIdentifierKey).toEqual("");
    expect((result as any).policyDocument.Statement[0].Effect).toEqual("Deny");
    expect((result as any).policyDocument.Statement[0].Resource).toEqual(beaconEvent.methodArn);
  });
});
