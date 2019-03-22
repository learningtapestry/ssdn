import { Backend } from "./backend";

interface BackendServiceConfig extends WebdriverIO.Config {
  backendPort?: number;
  backendStaticFolder?: string;
}

/**
 * A WebdriverIO service for starting and stopping the backend test server.
 */
export class BackendService {
  private backend: Backend | undefined;

  private port: number;

  private staticFolder: string;

  constructor(
    config: BackendServiceConfig,
    capabilities: WebDriver.DesiredCapabilities,
  ) {
    this.port = config.backendPort as number;
    this.staticFolder = config.backendStaticFolder as string;
  }

  public onPrepare(
    config: WebdriverIO.Config,
    capabilities: WebDriver.DesiredCapabilities,
  ) {
    if (this.port && this.staticFolder) {
      this.backend = new Backend(this.port, this.staticFolder);
      this.backend.listen();
    } else {
      throw new Error(
        "Port and static folder must be specified for BackendService.",
      );
    }
  }

  public onComplete(
    exitCode: number,
    config: BackendServiceConfig,
    capabilities: WebDriver.DesiredCapabilities,
    results: WebdriverIO.Results,
  ) {
    if (this.backend) {
      this.backend.close();
    }
  }
}
