import APIGateway from "aws-sdk/clients/apigateway";
import CloudFormation from "aws-sdk/clients/cloudformation";
import DynamoDB from "aws-sdk/clients/dynamodb";
import IAM from "aws-sdk/clients/iam";
import Kinesis from "aws-sdk/clients/kinesis";
import Lambda from "aws-sdk/clients/lambda";
import S3 from "aws-sdk/clients/s3";
import SNS from "aws-sdk/clients/sns";
import STS from "aws-sdk/clients/sts";

import { readEnv } from "./helpers/app-helper";

export function getDocumentClient(clientSettings = {}) {
  return new DynamoDB.DocumentClient(
    Object.assign(
      {
        apiVersion: "2012-08-10",
        endpoint: readEnv("SSDN_DYNAMODB_ENDPOINT", undefined),
      },
      clientSettings,
    ),
  );
}

export function getApiGateway(clientSettings = {}) {
  return new APIGateway(
    Object.assign(
      {
        apiVersion: "2015-07-09",
        endpoint: readEnv("SSDN_API_GATEWAY_ENDPOINT", undefined),
      },
      clientSettings,
    ),
  );
}

export function getIam(clientSettings = {}) {
  return new IAM(
    Object.assign(
      {
        apiVersion: "2010-05-08",
        endpoint: readEnv("SSDN_IAM_ENDPOINT", undefined),
      },
      clientSettings,
    ),
  );
}

export function getCloudFormation(clientSettings = {}) {
  return new CloudFormation(
    Object.assign(
      {
        apiVersion: "2010-05-15",
        endpoint: readEnv("SSDN_CLOUDFORMATION_ENDPOINT", undefined),
      },
      clientSettings,
    ),
  );
}

export function getKinesis(clientSettings = {}) {
  return new Kinesis({
    apiVersion: "2013-12-02",
    endpoint: readEnv("SSDN_KINESIS_ENDPOINT", undefined),
    ...clientSettings,
  });
}

export function getLambda(clientSettings = {}) {
  return new Lambda(
    Object.assign(
      {
        apiVersion: "2015-03-31",
        endpoint: readEnv("SSDN_LAMBDA_ENDPOINT", undefined),
      },
      clientSettings,
    ),
  );
}

export function getSts(clientSettings = {}) {
  return new STS({
    apiVersion: "2011-06-15",
    endpoint: readEnv("SSDN_STS_ENDPOINT", undefined),
    ...clientSettings,
  });
}

export function getS3(clientSettings = {}) {
  return new S3(
    Object.assign(
      {
        apiVersion: "2006-03-01",
        endpoint: readEnv("SSDN_S3_ENDPOINT", undefined),
      },
      clientSettings,
    ),
  );
}

export function getSns(clientSettings = {}) {
  return new SNS({
    apiVersion: "2010-03-31",
    endpoint: readEnv("SSDN_SNS_ENDPOINT", undefined),
    ...clientSettings,
  });
}
