import { ChainableTemporaryCredentials } from "aws-sdk/lib/credentials/chainable_temporary_credentials";

import TemporaryCredentialsFactory from "./temporary-credentials-factory";

// I have no idea why, but unless the test interacts with TemporaryCredentials somehow,
// it shows up as undefined.
(() => ChainableTemporaryCredentials)();

describe("TemporaryCredentialsFactory", () => {
  describe("getCredentials", () => {
    it("returns a TemporaryCredentials object", async () => {
      const factory = new TemporaryCredentialsFactory();
      const tempCredentials = await factory.getCredentials("TestArn", "TestExternalId");
      expect((tempCredentials as any).service.config.params).toEqual({
        ExternalId: "TestExternalId",
        RoleArn: "TestArn",
        RoleSessionName: expect.stringContaining("Nucleus-"),
      });
    });
  });
});
