/**
 * nucleus-cli.ts: Entry point for all commands related to Nucleus install and maintenance
 */

import { config as awsConfig } from "aws-sdk/global";
import { existsSync, readFile, writeFile } from "fs";
import inquirer, { Answers } from "inquirer";
import moment from "moment";
import { promisify } from "util";
import DeployAdminPanel from "./deploy-admin-panel";
import DeployCore from "./deploy-core";
import NucleusConfig from "./nucleus-config";

class NucleusCLI {
  private static readonly configFilePath = ".nucleus-config.json";
  private static readonly hostingParametersFilePath =
    "packages/admin/amplify/backend/hosting/S3AndCloudFront/parameters.json";

  private nucleusConfig!: NucleusConfig;

  public async install() {
    if (!existsSync(NucleusCLI.configFilePath)) {
      await this.configure();
      await this.regenerateBucketName();
    }
    await this.readConfiguration();
    await new DeployCore(this.nucleusConfig).run();
    await new DeployAdminPanel(this.nucleusConfig).run();
  }

  private configure() {
    const questions = [
      {
        message: "Enter the name of your organization",
        name: "organization",
        type: "input",
      },
      {
        message: "Enter the e-mail that will be used for notification purposes",
        name: "email",
        type: "input",
      },
      {
        message: "Enter your AWS Access Key ID",
        name: "accessKeyId",
        type: "input",
      },
      {
        message: "Enter your AWS Secret Access Key",
        name: "secretAccessKey",
        type: "input",
      },
      {
        default: "us-east-1",
        message: "Enter your default AWS region",
        name: "region",
        type: "input",
      },
      {
        choices: ["Development", "Production", "Test"],
        default: "Production",
        message:
          "Choose the environment for your Nucleus instance (this will affect some resource names)",
        name: "environment",
        type: "list",
      },
      {
        default: (answers: Answers) =>
          `nucleus-installer-${answers.organization.replace(/_/g, "-")}-${Date.now()}`,
        message: `Choose the name of the S3 bucket that will be used to deploy the application.
                  If it does not exist, it will be created.`,
        name: "bucket",
        type: "input",
        validate: (name: string) => {
          // tslint:disable-next-line:max-line-length
          const bucketRegExp = /(?=^.{3,63}$)(?!^(\d+\.)+\d+$)(^(([a-z0-9]|[a-z0-9][a-z0-9\-]*[a-z0-9])\.)*([a-z0-9]|[a-z0-9][a-z0-9\-]*[a-z0-9])$)/;
          return name.match(bucketRegExp) ? true : "Bucket name is not valid";
        },
      },
    ];
    return inquirer.prompt(questions).then(async (answers) => {
      await this.storeConfiguration(JSON.stringify(answers, null, 2));
      await this.regenerateBucketName();
    });
  }

  private async storeConfiguration(configuration: string) {
    await promisify(writeFile)(NucleusCLI.configFilePath, configuration, { mode: 0o600 });
  }

  private async regenerateBucketName() {
    const bucket = {
      bucketName: `nucleus-admin-${moment().format("YYYYMMDDHHmmss")}-hostingbucket`,
    };
    await promisify(writeFile)(NucleusCLI.hostingParametersFilePath, JSON.stringify(bucket));
  }

  private async readConfiguration() {
    const settings = await promisify(readFile)(NucleusCLI.configFilePath);
    this.nucleusConfig = JSON.parse(settings.toString());
    awsConfig.loadFromPath(NucleusCLI.configFilePath);
  }
}

export = NucleusCLI;
