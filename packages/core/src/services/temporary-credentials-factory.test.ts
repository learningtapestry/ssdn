import { TemporaryCredentials } from "aws-sdk/lib/credentials/temporary_credentials";

import TemporaryCredentialsFactory from "./temporary-credentials-factory";

// I have no idea why, but unless the test interacts with TemporaryCredentials somehow,
// it shows up as undefined.
(() => TemporaryCredentials)();

describe("TemporaryCredentialsFactory", () => {
  describe("getCredentials", () => {
    it("returns a TemporaryCredentials object", async () => {
      const factory = new TemporaryCredentialsFactory({ endpoint: "https://localhost" });
      const tempCredentials = await factory.getCredentials("TestArn", "TestExternalId");
      expect((tempCredentials as any).params).toEqual({
        ExternalId: "TestExternalId",
        RoleArn: "TestArn",
        RoleSessionName: expect.stringContaining("Nucleus-"),
        endpoint: "https://localhost",
      });
    });
  });
});
