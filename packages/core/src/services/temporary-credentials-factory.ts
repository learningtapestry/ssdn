import { TemporaryCredentials } from "aws-sdk/lib/core";
import { ServiceConfigurationOptions } from "aws-sdk/lib/service";

import TtlCache from "../helpers/ttl-cache";

type TemporaryCredentialsConstructorOptions = TemporaryCredentials.TemporaryCredentialsOptions &
  ServiceConfigurationOptions;

export default class TemporaryCredentialsFactory {
  private cache = new TtlCache<string, TemporaryCredentials>(24 * 60 * 60 * 1000);
  private tempCredentialsOptions: TemporaryCredentialsConstructorOptions;

  constructor(tempCredentialsOptions: TemporaryCredentialsConstructorOptions) {
    this.tempCredentialsOptions = tempCredentialsOptions;
  }

  public async getCredentials(roleArn: string, externalId: string) {
    const key = `${roleArn}.${externalId}`;
    return await this.cache.get(
      key,
      async () =>
        new TemporaryCredentials({
          ...this.tempCredentialsOptions,
          ExternalId: externalId,
          RoleArn: roleArn,
          RoleSessionName: `Nucleus-${new Date().getTime()}`,
        }),
    );
  }
}
