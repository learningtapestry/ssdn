import { Connection } from "../src/interfaces/connection";
import { ConnectionRequest, ConnectionRequestStatus } from "../src/interfaces/connection-request";
import Event, { EventMetadata } from "../src/interfaces/event";
import {
  FileTransferNotification,
  FileTransferNotificationType,
  SNSFileTransferNotification,
} from "../src/interfaces/file-transfer-notification";
import { Format } from "../src/interfaces/format";
import { UploadCredentials } from "../src/interfaces/upload-credentials";

export function buildConnectionRequest(overrides?: Partial<ConnectionRequest>): ConnectionRequest {
  const defaults = {
    acceptanceToken: "",
    connection: {
      awsAccountId: "",
      ssdnId: "",
    },
    consumerEndpoint: "",
    creationDate: "",
    formats: [],
    id: "",
    namespace: "",
    organization: "",
    providerEndpoint: "",
    status: ConnectionRequestStatus.Created,
    type: "",
    verificationCode: "",
  };

  return {
    ...defaults,
    ...overrides,
  };
}

export function buildConnection(overrides?: Partial<Connection>): Connection {
  const defaults = {
    connection: {
      arn: "",
      awsAccountId: "",
      externalId: "",
      roleName: "",
      ssdnId: "",
    },
    creationDate: "",
    endpoint: "",
    externalConnection: {
      arn: "",
      externalId: "",
    },
    inputStreams: [],
    isConsumer: false,
    isProvider: false,
    metadata: {
      AwsRegion: "",
      EventProcessorStream: "",
      UploadS3Bucket: "",
    },
    outputStreams: [],
    updateDate: "",
  };

  return {
    ...defaults,
    ...overrides,
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

export function buildEventMetadata(overrides?: Partial<EventMetadata>) {
  const eventMetadata = {
    date: "",
    format: "xAPI",
    namespace: "",
    operation: "",
    origin: "",
    protocol: "",
    representation: "",
    request: {
      headers: {},
      queryStringParameters: {},
    },
    resource: "",
    resourceId: "",
  };
  return {
    ...eventMetadata,
    ...(overrides as any),
  };
}

export function buildEvent(overrides?: Partial<Event>) {
  const event = {
    content: "",
    event: buildEventMetadata(),
  };
  return {
    ...event,
    ...(overrides as any),
  };
}

export function buildUploadCredentials(overrides?: Partial<UploadCredentials>) {
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
    ...overrides,
  };
}

export function buildFileTransferNotification(overrides?: Partial<FileTransferNotification>) {
  return {
    bucket: "example-bucket",
    creationDate: "2019-06-04T13:38:39.537Z",
    details:
      "aws-service.ts:295 Uncaught (in promise) Error: An unexpected error occurred: " +
      "Network Error at _callee36$ (aws-service.ts:295)",
    file: "ssdn-test.learningtapestry.com/xAPI/test.txt",
    id: "4f331ac9-5d41-4129-ad1b-b704adc80ce2",
    message: "This is a test message for the file transfer notification topic",
    subject: "This is a test message",
    type: FileTransferNotificationType.Error,
    ...overrides,
  };
}

export function buildSNSFileTransferNotification(overrides?: Partial<SNSFileTransferNotification>) {
  return {
    bucket: "example-bucket",
    details:
      "aws-service.ts:295 Uncaught (in promise) Error: An unexpected error occurred: " +
      "Network Error at _callee36$ (aws-service.ts:295)",
    file: "ssdn-test.learningtapestry.com/xAPI/test.txt",
    message: "This is a test message for the file transfer notification topic",
    subject: "This is a test message",
    type: FileTransferNotificationType.Error,
    ...overrides,
  };
}
