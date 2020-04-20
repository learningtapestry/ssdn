/**
 * deploy-core.ts: Executes the AWS CloudFormation commands to deploy the core resources
 */

import S3 from "aws-sdk/clients/s3";
import execa from "execa";
import { execute, printBright, printSuccess } from "./app-helper";
import logger from "./logger";
import SSDNConfig from "./ssdn-config";

export default class DeployCore {
  private ssdnConfig: SSDNConfig;

  constructor(ssdnConfig: SSDNConfig) {
    this.ssdnConfig = ssdnConfig;
  }

  public async run() {
    printBright("Deploying SSDN Core...");
    await this.createBucket();
    await this.package();
    await this.deploy();
    printSuccess("SSDN Core deployed!");
  }

  public async package() {
    console.log("    Packaging CloudFormation template...");
    await this.awsCommand([
      "cloudformation",
      "package",
      "--template-file",
      "template.yaml",
      "--output-template-file",
      "packaged.yaml",
      "--s3-bucket",
      this.ssdnConfig.bucket,
    ]);
  }

  public async deploy() {
    console.log("    Deploying CloudFormation template...");
    await this.awsCommand(
      [
        "cloudformation",
        "deploy",
        "--template-file",
        "packaged.yaml",
        "--stack-name",
        this.ssdnConfig.stackName,
        "--capabilities",
        "CAPABILITY_NAMED_IAM",
        "--no-fail-on-empty-changeset",
        "--s3-bucket",
        this.ssdnConfig.bucket,
        "--parameter-overrides",
      ].concat(this.parameters()),
    );
  }

  private async awsCommand(parameters: string[]) {
    await execute(async () => {
      const { stdout } = await execa("aws", parameters, {
        cwd: "packages/core",
        env: this.envCredentials(),
      });
      logger.info(stdout);
    });
  }

  private async createBucket() {
    const s3 = new S3({ apiVersion: "2006-03-01" });
    try {
      await s3.headBucket({ Bucket: this.ssdnConfig.bucket }).promise();
    } catch (error) {
      logger.info(`Creating bucket '${this.ssdnConfig.bucket}'`);
      await s3.createBucket({ Bucket: this.ssdnConfig.bucket }).promise();
    }
  }

  private envCredentials() {
    return {
      AWS_ACCESS_KEY_ID: this.ssdnConfig.accessKeyId,
      AWS_DEFAULT_REGION: this.ssdnConfig.region,
      AWS_SECRET_ACCESS_KEY: this.ssdnConfig.secretAccessKey,
    };
  }

  private parameters() {
    return [
      `Environment=${this.ssdnConfig.environment}`,
      `Namespace=${this.ssdnConfig.namespace}`,
      `NotificationEmail=${this.ssdnConfig.email}`,
      `SSDNId=${this.ssdnConfig.instanceId}`,
    ];
  }
}
