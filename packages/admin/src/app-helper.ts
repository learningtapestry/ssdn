/**
 * app-helper.ts: General module containing utility functions
 */
import uuid from "uuid/v4";

import { Connection } from "./interfaces/connection";
import { ConnectionRequest, ConnectionRequestStatus } from "./interfaces/connection-request";
import {
  FileTransferNotification,
  FileTransferNotificationType,
} from "./interfaces/file-transfer-notification";
import Instance from "./interfaces/instance";
import { StreamStatus } from "./interfaces/stream";

export function displayDate(val: number | string | Date) {
  return new Date(val).toLocaleString("en-US", { timeZone: "America/New_York" });
}

export function nullInstance(): Instance {
  return {
    name: "",
    settings: [],
  };
}

export function nullUser() {
  return {
    creationDate: new Date(),
    email: "null@example.org",
    fullName: "Null User",
    phoneNumber: "+15555555555",
    status: "CONFIRMED",
    username: "null-user",
  };
}

export function nullConnectionRequest(
  overrideProps?: Partial<ConnectionRequest>,
): ConnectionRequest {
  return {
    acceptanceToken: uuid(),
    connection: {
      awsAccountId: uuid(),
      externalId: uuid(),
      ssdnId: uuid(),
    },
    consumerEndpoint: "https://example.org/register",
    creationDate: new Date(),
    formats: ["Caliper"],
    id: uuid(),
    namespace: "example.org",
    organization: "Organization 1",
    providerEndpoint: "https://example.org/register",
    status: ConnectionRequestStatus.Pending,
    type: "incoming",
    verificationCode: "123456",
    ...overrideProps,
  };
}

export function nullConnection(overrideProps?: Partial<Connection>): Connection {
  return {
    creationDate: "",
    endpoint: "https://example.org/register",
    inputStreams: [{ namespace: "acme.org", format: "xAPI", status: StreamStatus.Active }],
    isConsumer: true,
    isProvider: true,
    outputStreams: [{ namespace: "acme.org", format: "xAPI", status: StreamStatus.Active }],
    updateDate: "",
    ...overrideProps,
  };
}

export function nullFileTransferNotification(): FileTransferNotification {
  return {
    bucket: "null-bucket",
    creationDate: new Date(),
    file: "/null.file",
    id: "NULL-ID",
    message: "This is a null notification",
    subject: "Null Notification",
    type: FileTransferNotificationType.Info,
  };
}

export function nullQueue() {
  return {
    arn: "arn:aws:sqs:us-east-1:111111111111:ssdn-queue",
    modificationDate: new Date(),
    status: "Disabled",
    uuid: "8b29ea99-2f34-4432-b12b-ded8347ed99e",
  };
}
