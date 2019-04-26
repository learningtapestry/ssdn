import { createApiKey } from "../test-support/aws";
import { getApiKey } from "./aws-helper";

describe("AwsHelper", () => {
  describe("getApiKey", () => {
    it("fetches an api key by its id", async () => {
      const createdKey = await createApiKey();
      const gatewayKey = await getApiKey(createdKey.id as string);
      expect(gatewayKey.id).toEqual(createdKey.id);
    });

    it("throws when the id isnt found", async () => {
      const get = async () => await getApiKey("a1b2c3d4e5");
      expect(get()).rejects.toThrow();
    });
  });
});
