/**
 * ssdn-c-l-i.ts: Entry point for all commands related to SSDN install and maintenance
 */

import slugify from "@sindresorhus/slugify";
import { config as awsConfig } from "aws-sdk/global";
import { existsSync, readFile, writeFile } from "fs";
import inquirer, { Answers, Questions } from "inquirer";
import moment from "moment";
import generate from "nanoid/generate";
import { promisify } from "util";
import { getStackValues } from "./app-helper";
import DeployAdminPanel from "./deploy-admin-panel";
import DeployCore from "./deploy-core";
import SSDNConfig from "./ssdn-config";

class SSDNCLI {
  private static readonly configFilePath = ".ssdn-config.json";
  private static readonly hostingParametersFilePath =
    "packages/admin/amplify/backend/hosting/S3AndCloudFront/parameters.json";

  private static async instanceId(organization: string) {
    const id = await generate("0123456789abcdefghijklmnopqrstuvwxyz", 15);

    return `${slugify(organization)}-${id}`;
  }

  private ssdnConfig!: SSDNConfig;

  public async install() {
    if (!existsSync(SSDNCLI.configFilePath)) {
      await this.configure();
    }
    await this.readConfiguration();
    await new DeployCore(this.ssdnConfig).run();
    await this.exportStackConfiguration();
    await new DeployAdminPanel(this.ssdnConfig).run();
  }

  private configure() {
    const questions = [
      {
        message: "Enter the name of your organization",
        name: "organization",
        type: "input",
        validate: (name: string) =>
          name.length <= 15 ? true : "Organization name is too long (max: 15 characters)",
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
          "Choose the environment for your SSDN instance (this will affect some resource names)",
        name: "environment",
        type: "list",
      },
      {
        default: "ssdn.learningtapestry.com",
        message: "Choose the namespace that will be used to identify data from this instance",
        name: "namespace",
        type: "input",
      },
      {
        default: async (answers: Answers) =>
          `ssdn-installer-${await SSDNCLI.instanceId(answers.organization)}`,
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
    return inquirer.prompt(questions as Questions).then(async (answers: Answers) => {
      const id = await SSDNCLI.instanceId(answers.organization);
      const config = {
        ...answers,
        instanceId: id,
        stackName: `SSDN-${id}-${answers.environment}`,
      };
      await this.storeConfiguration(JSON.stringify(config, null, 2));
      await this.regenerateBucketName();
    });
  }

  private async storeConfiguration(configuration: string) {
    await promisify(writeFile)(SSDNCLI.configFilePath, configuration, { mode: 0o600 });
  }

  private async regenerateBucketName() {
    const bucket = {
      bucketName: `ssdn-admin-${moment().format("YYYYMMDDHHmmss")}-hostingbucket`,
    };
    await promisify(writeFile)(SSDNCLI.hostingParametersFilePath, JSON.stringify(bucket));
  }

  private async readConfiguration() {
    const settings = await promisify(readFile)(SSDNCLI.configFilePath);
    this.ssdnConfig = JSON.parse(settings.toString());
    awsConfig.loadFromPath(SSDNCLI.configFilePath);
  }

  private async exportStackConfiguration() {
    const outputs: any = await getStackValues(this.ssdnConfig.stackName);
    process.env.REACT_APP_ENDPOINT = outputs.ExchangeApi;
    process.env.REACT_APP_ENTITIES_ENDPOINT = outputs.EntitiesApi;
    process.env.REACT_APP_FILE_TRANSFER_NOTIFICATIONS_ENDPOINT =
      outputs.FileTransferNotificationsApi;
    process.env.REACT_APP_IDENTITY_POOL_ID = outputs.CognitoIdentityPoolId;
    process.env.REACT_APP_SSDN_ID = outputs.SSDNId;
    process.env.REACT_APP_AWS_REGION = this.ssdnConfig.region;
    process.env.REACT_APP_STACK_NAME = this.ssdnConfig.stackName;
    process.env.REACT_APP_USER_POOL_ID = outputs.CognitoUserPoolId;
    process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID = outputs.CognitoUserPoolClientWebId;
  }
}

export = SSDNCLI;
