/**
 * app-helper.ts: General module containing utility functions
 */
import uuid from "uuid/v4";
import { ConnectionRequest, ConnectionRequestStatus } from "./interfaces/connection-request";

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

export function nullConnectionRequest(): ConnectionRequest {
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
  };
}
