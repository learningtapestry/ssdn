/**
 * factories.ts: Utility functions that create domain objects, useful for testing.
 */

import flatMap from "lodash/fp/flatMap";
import { Connection } from "../src/interfaces/connection";
import { Format } from "../src/interfaces/format";
import UserForm from "../src/interfaces/user-form";
import * as responses from "./service-responses";

export const ssdnDevStack = {
  name: "SSDN-Dev",
  settings: [
    {
      description: "Name of the Event Processor Kinesis Data Stream",
      key: "EventProcessorStreamName",
      value: "SSDN-Development-EventProcessor",
    },
    {
      description: "Endpoint that generates temporary upload credentials to specific folders",
      key: "GenerateUploadCredentialsApi",
      value: "https://ssdn.example.org/Development",
    },
    {
      description: "Default API Key to access the upload credentials endpoint",
      key: "GenerateUploadCredentialsApiKeyId",
      value: "okothmfzma",
    },
    {
      description: "Hello SSDN Lambda Function ARN",
      key: "HelloSSDNFunction",
      value:
        `arn:aws:lambda:us-east-1:111111111111:function:` +
        `SSDN-Dev-HelloSSDNFunction-HCJE3P62QE5P`,
    },
    {
      description: "Reads and processes a message from an SQS queue",
      key: "ProcessSQSMessageFunction",
      value:
        "arn:aws:lambda:us-east-1:111111111111:function:SSDN-ProcessSQSMessageFunction-18XOSMJC66JZK",
    },
  ],
};

export const ssdnStack = {
  name: "SSDN",
  settings: [
    {
      description: "Name of the Event Processor Kinesis Data Stream",
      key: "EventProcessorStreamName",
      value: "SSDN-Production-EventProcessor",
    },
    {
      description: "Endpoint that generates temporary upload credentials to specific folders",
      key: "GenerateUploadCredentialsApi",
      value: "https://ssdn.example.org/Production",
    },
    {
      description: "Default API Key to access the upload credentials endpoint",
      key: "GenerateUploadCredentialsApiKeyId",
      value: "okothmfzma",
    },
    {
      description: "Hello SSDN Lambda Function ARN",
      key: "HelloSSDNFunction",
      value: "arn:aws:lambda:us-east-1:111111111111:function:SSDN-HelloSSDNFunction-60K87QSYCYTJ",
    },
    {
      description: "Reads and processes a message from an SQS queue",
      key: "ProcessSQSMessageFunction",
      value:
        "arn:aws:lambda:us-east-1:111111111111:function:SSDN-ProcessSQSMessageFunction-18XOSMJC66JZK",
    },
  ],
};

export function instances() {
  return [{ ...ssdnDevStack }, { ...ssdnStack }];
}

export function users() {
  return [
    {
      creationDate: new Date("2019-04-05T18:50:49.916Z"),
      email: "test-user-1@example.org",
      fullName: "Test User 1",
      phoneNumber: "+1555555555",
      status: "CONFIRMED",
      username: "test-user-1",
    },
    {
      creationDate: new Date("2019-04-08T17:26:53.321Z"),
      email: "test-user-2@example.org",
      fullName: "Test User 2",
      phoneNumber: "+1666666666",
      status: "FORCE_CHANGE_PASSWORD",
      username: "test-user-2",
    },
  ];
}

export function userForm(userParams: UserForm) {
  return {
    email: "cypress-user@example.org",
    name: "Cypress User",
    password: "@Mb94TQT5nqE",
    phoneNumber: "+1555555555",
    username: "cypress-user",
    ...userParams,
  };
}

export function buildFormat(overrides?: Partial<Format>): Format {
  return {
    creationDate: "",
    description: "",
    name: "",
    updateDate: "",
    ...overrides,
  };
}

export function connectionRequests() {
  return responses.connectionRequestItems().Items;
}

export function connections() {
  return responses.connections().Items;
}

export function inputStreams() {
  return flatMap((item: Connection) =>
    item.inputStreams
      ? item.inputStreams.map((stream) => ({
          endpoint: item.endpoint,
          format: stream.format,
          namespace: stream.namespace,
          status: stream.status,
        }))
      : [],
  )(responses.connections().Items);
}

export function outputStreams() {
  return flatMap((item: Connection) =>
    item.outputStreams
      ? item.outputStreams.map((stream) => ({
          endpoint: item.endpoint,
          format: stream.format,
          namespace: stream.namespace,
          status: stream.status,
        }))
      : [],
  )(responses.connections().Items);
}

export function logGroups() {
  return [
    "/aws/lambda/SSDN-AuthorizeBeaconFunction-1P2GO4YF9VZA7",
    "/aws/lambda/SSDN-ProcessXAPIStatementFunction-HCJE3P62QE5P",
  ];
}

export function logEvents() {
  return [
    {
      creationDate: new Date(1555255315091),
      message: "START RequestId: df528d1a-6049-4430-8835-38e7ef58b800 Version: $LATEST\n",
    },
    {
      creationDate: new Date(1555255316099),
      message: "END RequestId: df528d1a-6049-4430-8835-38e7ef58b800\n",
    },
  ];
}

export function uploadCredentials() {
  return {
    credentials: {
      accessKeyId: "AKIAIOSFODNN7EXAMPLE",
      secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYzEXAMPLEKEY",
      sessionToken: `AQoDYXdzEPT//////////wEXAMPLEtc764bNrC9SAPBSM22wDOk4x4HIZ8j4FZTwdQWLWsKWHGBuFq
wAeMicRXmxfpSPfIeoIYRqTflfKD8YUuwthAx7mSEI/qkPpKPi/kMcGdQrmGdeehM4IC1NtBmUpp2wUE8phUZampKsburEDy0KPk
yQDYwT7WZ0wq5VSXDvp75YU9HFvlRd8Tx6q6fE8YQcHNVXAkiY9q6d+xo0rKwT38xVqr7ZD0u0iPPkUL64lIZbqBAz+scqKmlzm8
FDrypNC9Yjc8fPOLn9FX9KSYvKTr4rvx3iSIlTJabIQwj2ICCR/oLxBA==`,
    },
    instructions: "These are the test instructions...",
  };
}

export function fileTransferNotifications() {
  return [
    {
      bucket: "example-bucket",
      creationDate: new Date(2019, 6, 4, 13, 38, 39),
      details: "aws-service.ts:295 Uncaught (in promise) Error: An unexpected error occurred",
      file: "ssdn-test.learningtapestry.com/xAPI/test.txt",
      id: "4f331ac9-5d41-4129-ad1b-b704adc80ce2",
      message: "Network error has occurred",
      subject: "This is a test message",
      type: "error",
    },
    {
      bucket: "another-bucket",
      creationDate: new Date(2019, 6, 7, 12, 55, 8),
      file: "ssdn-test.learningtapestry.com/Caliper/file.pdf",
      id: "e0ad3b90-4169-4267-a293-52767c1ce78b",
      message: "File was successfully transferred",
      subject: "This is another test message",
      type: "info",
    },
  ];
}

export function queueArns() {
  return [
    "arn:aws:sqs:us-east-1:111111111111:ssdn-one-queue",
    "arn:aws:sqs:us-east-1:111111111111:ssdn-another-queue",
  ];
}

export function queueMappings() {
  return [
    {
      arn: "arn:aws:sqs:us-east-1:111111111111:ssdn-one-queue",
      modificationDate: new Date("2019-10-02T17:25:18.199Z"),
      status: "Enabled",
      uuid: "48aeaf30-abc6-4cc4-9bdf-9fc6d8f4f9ad",
    },
    {
      arn: "arn:aws:sqs:us-east-1:111111111111:ssdn-another-queue",
      modificationDate: new Date("2019-10-03T11:32:32.102Z"),
      status: "Disabled",
      uuid: "3d865ff0-5949-4cd9-810c-f31a481f8b1a",
    },
  ];
}
