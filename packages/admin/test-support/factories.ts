import flatMap from "lodash/fp/flatMap";

import { Connection } from "../src/interfaces/connection";
/**
 * factories.ts: Utility functions that create domain objects, useful for testing.
 */
import UserForm from "../src/interfaces/user-form";
import * as responses from "./service-responses";

export const nucleusDevStack = {
  name: "Nucleus-Dev",
  settings: [
    {
      description: "Name of the Event Processor Kinesis Data Stream",
      key: "EventProcessorStreamName",
      value: "Nucleus-Development-EventProcessor",
    },
    {
      description: "Hello Nucleus Lambda Function ARN",
      key: "HelloNucleusFunction",
      value:
        `arn:aws:lambda:us-east-1:111111111111:function:` +
        `Nucleus-Dev-HelloNucleusFunction-HCJE3P62QE5P`,
    },
  ],
};

export const nucleusStack = {
  name: "Nucleus",
  settings: [
    {
      description: "Name of the Event Processor Kinesis Data Stream",
      key: "EventProcessorStreamName",
      value: "Nucleus-Production-EventProcessor",
    },
    {
      description: "Hello Nucleus Lambda Function ARN",
      key: "HelloNucleusFunction",
      value:
        "arn:aws:lambda:us-east-1:111111111111:function:" +
        "Nucleus-HelloNucleusFunction-60K87QSYCYTJ",
    },
  ],
};

export function instances() {
  return [{ ...nucleusDevStack }, { ...nucleusStack }];
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
    "/aws/lambda/Nucleus-AuthorizeBeaconFunction-1P2GO4YF9VZA7",
    "/aws/lambda/Nucleus-ProcessXAPIStatementFunction-HCJE3P62QE5P",
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
