import { ChainableTemporaryCredentials, EnvironmentCredentials } from "aws-sdk/lib/core";

import TtlCache from "../helpers/ttl-cache";

export default class ChainableTemporaryCredentialsFactory {
  private cache = new TtlCache<string, ChainableTemporaryCredentials>(24 * 60 * 60 * 1000);

  public async getCredentials(roleArn: string, externalId: string) {
    const key = `${roleArn}.${externalId}`;
    return await this.cache.get(
      key,
      async () =>
        new ChainableTemporaryCredentials({
          masterCredentials: new EnvironmentCredentials("AWS"),
          params: {
            ExternalId: externalId,
            RoleArn: roleArn,
            RoleSessionName: `SSDN-${new Date().getTime()}`,
          },
          stsConfig: {},
        }),
    );
  }
}
