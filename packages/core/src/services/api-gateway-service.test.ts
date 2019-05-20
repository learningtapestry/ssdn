import APIGateway from "aws-sdk/clients/apigateway";

import { fakeAws } from "../../test-support/jest-helper";
import ApiGatewayService from "./api-gateway-service";

const fakeApiGateway = fakeAws<APIGateway>({
  getApiKey: jest.fn((params: any) =>
    params.apiKey === "1" ? Promise.resolve({ enabled: true, value: "123456" }) : Promise.reject(),
  ),
});

describe("ApiGatewayService", () => {
  describe("getApiKey", () => {
    it("returns an API key with value", async () => {
      const service = new ApiGatewayService(fakeApiGateway);
      const key = await service.getApiKey({ value: "1" });
      expect(key).toEqual({ enabled: true, value: "123456" });
      expect(fakeApiGateway.getApiKey).toHaveBeenCalledWith({
        apiKey: "1",
        includeValue: true,
      });
    });
  });
});
