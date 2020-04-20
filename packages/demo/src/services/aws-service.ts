import Auth from "@aws-amplify/auth";
import Amplify from "@aws-amplify/core";
import DynamoDB from "aws-sdk/clients/dynamodb";
import S3 from "aws-sdk/clients/s3";
import { config } from "aws-sdk/global";
import FileSaver from "file-saver";
import { basename } from "path";
import { DemoEvent } from "ssdn-core/src/interfaces/demo-event";
import awsconfig from "../aws-exports";
import demoConfig from "../config";

export default class AWSService {
  public static async configure() {
    Amplify.configure(awsconfig);
    await AWSService.updateCredentials();
    config.apiVersions = {
      dynamodb: "2012-08-10",
      s3: "2006-03-01",
    };
  }

  public static async updateCredentials() {
    config.update({
      credentials: await Auth.currentCredentials(),
      region: awsconfig.aws_project_region,
    });
  }

  public static async uploadFile(data: string | ArrayBuffer, key: string) {
    return AWSService.withCredentials(async () => {
      await new S3()
        .putObject({
          Body: data,
          Bucket: demoConfig.uploadBucket,
          Key: key,
        })
        .promise();
    });
  }

  public static async downloadFile(bucket: string, key: string) {
    return AWSService.withCredentials(async () => {
      const file = await new S3()
        .getObject({
          Bucket: bucket,
          Key: key,
        })
        .promise();

      FileSaver.saveAs(new Blob([file.Body as Buffer]), basename(key));
    });
  }

  public static async retrieveDemoEvents() {
    return AWSService.withCredentials(async () => {
      const documentClient = new DynamoDB.DocumentClient();
      const demoEvents = await documentClient
        .scan({
          TableName: demoConfig.demoEventsTable,
        })
        .promise();

      return (demoEvents.Items as DemoEvent[]).sort(
        (a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime(),
      );
    });
  }

  private static async withCredentials(request: () => Promise<any>) {
    try {
      try {
        return await request();
      } catch (error) {
        if (error.code && error.code === "CredentialsError") {
          await AWSService.updateCredentials();
          return await request();
        } else {
          throw error;
        }
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.errors) {
        throw new Error(error.response.data.errors[0].detail);
      }
      throw new Error(`An unexpected error occurred: ${error.message}`);
    }
  }
}
