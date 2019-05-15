/**
 * deploy-core.ts: Executes the AWS CloudFormation commands to deploy the core resources
 */

import S3 from "aws-sdk/clients/s3";
import execa from "execa";
import { execute, printBright, printSuccess } from "./app-helper";
import logger from "./logger";
import NucleusConfig from "./nucleus-config";

export default class DeployCore {
  private nucleusConfig: NucleusConfig;

  constructor(nucleusConfig: NucleusConfig) {
    this.nucleusConfig = nucleusConfig;
  }

  public async run() {
    printBright("Deploying Nucleus Core...");
    await this.createBucket();
    await this.package();
    await this.deploy();
    printSuccess("Nucleus Core deployed!");
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
      this.nucleusConfig.bucket,
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
        this.nucleusConfig.stackName,
        "--capabilities",
        "CAPABILITY_NAMED_IAM",
        "--no-fail-on-empty-changeset",
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
      await s3.headBucket({ Bucket: this.nucleusConfig.bucket }).promise();
    } catch (error) {
      logger.info(`Creating bucket '${this.nucleusConfig.bucket}'`);
      await s3.createBucket({ Bucket: this.nucleusConfig.bucket }).promise();
    }
  }

  private envCredentials() {
    return {
      AWS_ACCESS_KEY_ID: this.nucleusConfig.accessKeyId,
      AWS_DEFAULT_REGION: this.nucleusConfig.region,
      AWS_SECRET_ACCESS_KEY: this.nucleusConfig.secretAccessKey,
    };
  }

  private parameters() {
    return [
      `Environment=${this.nucleusConfig.environment}`,
      `Namespace=${this.nucleusConfig.namespace}`,
      `NotificationEmail=${this.nucleusConfig.email}`,
      `NucleusId=${this.nucleusConfig.instanceId}`,
    ];
  }
}
