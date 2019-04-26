import axios from "axios";

import { getApiKey } from "../src/helpers/aws-helper";
import { currentStack, getOutputValue } from "../test-support/aws";
import xAPIStatement from "../test-support/data-samples/xapi-statement.json";

describe("Process xAPI Statement API", () => {
  let statementsEndpoint: string;
  let apiKey: string | undefined;

  beforeAll(async () => {
    jest.setTimeout(15000);
    const apiKeyId = await getOutputValue("CollectionApiKeyId", currentStack());
    statementsEndpoint = await getOutputValue("StatementsApi", currentStack());
    const gatewayKey = await getApiKey(apiKeyId);
    apiKey = gatewayKey.value;
  });

  beforeEach(async () => {
    axios.defaults.headers.common["x-api-key"] = apiKey;
    axios.defaults.headers.common["X-Experience-API-Version"] = "1.0.3";
  });

  describe("Positive outcomes", () => {
    it("stores a batch of statements using POST", async () => {
      const response = await axios.post(statementsEndpoint, [xAPIStatement, xAPIStatement]);

      expect(response.status).toEqual(200);
      expect(response.data).toEqual([
        "d1eec41f-1e93-4ed6-acbf-5c4bd0c24269",
        "d1eec41f-1e93-4ed6-acbf-5c4bd0c24269",
      ]);
    });

    it("stores a single statement using PUT", async () => {
      const response = await axios.put(statementsEndpoint, xAPIStatement, {
        params: { statementId: "d1eec41f-1e93-4ed6-acbf-5c4bd0c24269" },
      });

      expect(response.status).toEqual(200);
      expect(response.data).toEqual(["d1eec41f-1e93-4ed6-acbf-5c4bd0c24269"]);
    });
  });

  describe("Negative outcomes", () => {
    it("denies access when API Key is invalid", async () => {
      axios.defaults.headers.common["x-api-key"] = "INVALID";

      try {
        await axios.post(statementsEndpoint, xAPIStatement);
      } catch (error) {
        expect(error.response.status).toEqual(403);
        expect(error.response.data.message).toEqual("Forbidden");
      }
    });

    it("rejects request when xAPI version header is not set", async () => {
      delete axios.defaults.headers.common["X-Experience-API-Version"];

      try {
        await axios.post(statementsEndpoint, xAPIStatement);
      } catch (error) {
        expect(error.response.status).toEqual(400);
        expect(error.response.data.message).toEqual(
          "Missing required request parameters: [X-Experience-API-Version]",
        );
      }
    });

    it("rejects PUT request when statementId parameter is not set", async () => {
      try {
        await axios.put(statementsEndpoint, xAPIStatement);
      } catch (error) {
        expect(error.response.status).toEqual(400);
        expect(error.response.data.message).toEqual(
          "Missing required request parameters: [statementId]",
        );
      }
    });
  });
});
