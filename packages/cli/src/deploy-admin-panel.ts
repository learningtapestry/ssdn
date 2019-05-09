/**
 * deploy-admin-panel.ts: Executes the Amplify commands to deploy the administration panel
 */

import execa from "execa";
import { execute, printBright, printSuccess } from "./app-helper";
import logger from "./logger";
import NucleusConfig from "./nucleus-config";

export default class DeployAdminPanel {
  private static async amplifyCommand(parameters: string[]) {
    await execute(async () => {
      const { stdout } = await execa("amplify", parameters, { cwd: "packages/admin" });
      logger.info(stdout);
    });
  }

  private static async publish() {
    console.log("    Publishing Amplify resources...");
    await DeployAdminPanel.amplifyCommand(["publish"]);
  }

  private static async status() {
    await DeployAdminPanel.amplifyCommand(["status"]);
  }

  private nucleusConfig: NucleusConfig;
  private readonly environment: string;

  constructor(nucleusConfig: NucleusConfig) {
    this.nucleusConfig = nucleusConfig;
    const options: { [key: string]: string } = {
      Development: "dev",
      Production: "prod",
      Test: "test",
    };
    this.environment = options[this.nucleusConfig.environment];
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
      projectName: "nucleus-admin",
    });
  }

  private cloudFormationConfiguration() {
    return JSON.stringify({
      awscloudformation: {
        accessKeyId: this.nucleusConfig.accessKeyId,
        region: this.nucleusConfig.region,
        secretAccessKey: this.nucleusConfig.secretAccessKey,
        useProfile: false,
      },
    });
  }
}
