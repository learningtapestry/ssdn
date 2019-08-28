/**
 * deploy-admin-panel.ts: Executes the Amplify commands to deploy the administration panel
 */

import execa from "execa";
import { execute, printBright, printSuccess } from "./app-helper";
import logger from "./logger";
import SSDNConfig from "./ssdn-config";

export default class DeployAdminPanel {
  private static async amplifyCommand(parameters: string[]) {
    await execute(async () => {
      const { all } = await execa("amplify", parameters, { cwd: "packages/admin" });
      logger.info(all);
    });
  }

  private static async publish() {
    console.log("    Publishing Amplify resources...");
    await DeployAdminPanel.amplifyCommand(["publish"]);
  }

  private static async status() {
    await DeployAdminPanel.amplifyCommand(["status"]);
  }

  private ssdnConfig: SSDNConfig;
  private readonly environment: string;

  constructor(ssdnConfig: SSDNConfig) {
    this.ssdnConfig = ssdnConfig;
    const options: { [key: string]: string } = {
      Development: "dev",
      Production: "prod",
      Test: "test",
    };
    this.environment = options[this.ssdnConfig.environment];
  }

  public async run() {
    printBright("Deploying Admin Panel...");
    await this.init();
    await DeployAdminPanel.publish();
    await DeployAdminPanel.status();
    printSuccess("Admin Panel deployed!");
  }

  public async init() {
    console.log("    Initializing Amplify environment...");
    await DeployAdminPanel.amplifyCommand([
      "init",
      "--amplify",
      this.amplifyConfiguration(),
      "--providers",
      this.cloudFormationConfiguration(),
      "--yes",
    ]);
  }

  private amplifyConfiguration() {
    return JSON.stringify({
      envName: this.environment,
      projectName: "ssdn-admin",
    });
  }

  private cloudFormationConfiguration() {
    return JSON.stringify({
      awscloudformation: {
        accessKeyId: this.ssdnConfig.accessKeyId,
        region: this.ssdnConfig.region,
        secretAccessKey: this.ssdnConfig.secretAccessKey,
        useProfile: false,
      },
    });
  }
}
