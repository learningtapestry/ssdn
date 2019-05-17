/**
 * app-helper.ts: General module containing utility functions
 */
import uuid from "uuid/v4";

import { Connection } from "./interfaces/connection";
import { ConnectionRequest, ConnectionRequestStatus } from "./interfaces/connection-request";
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
    channels: ["S3"],
    connection: {
      awsAccountId: uuid(),
      externalId: uuid(),
      nucleusId: uuid(),
    },
    consumerEndpoint: "https://example.org/register",
    creationDate: new Date(),
    email: "director@example.org",
    firstName: "Null",
    id: uuid(),
    lastName: "Connection Request",
    namespace: "example.org",
    organization: "Organization 1",
    phoneNumber: "+15555555555",
    providerEndpoint: "https://example.org/register",
    status: ConnectionRequestStatus.Pending,
    title: "Director",
    type: "incoming",
    verificationCode: "123456",
    ...overrideProps,
  };
}

export function nullConnection(overrideProps?: Partial<Connection>): Connection {
  return {
    creationDate: "",
    endpoint: "https://example.org/register",
    inputStreams: [{ namespace: "acme.org", channel: "XAPI", status: StreamStatus.Active }],
    isConsumer: true,
    isProvider: true,
    outputStreams: [{ namespace: "acme.org", channel: "XAPI", status: StreamStatus.Active }],
    updateDate: "",
    ...overrideProps,
  };
}
