/**
 * app-helper.ts: General module containing utility functions
 */
import uuid from "uuid/v4";

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

export function nullConnectionRequest() {
  return {
    creationDate: new Date(),
    email: "director@example.org",
    endpoint: "https://example.org/register",
    firstName: "Null",
    id: uuid(),
    lastName: "Connection Request",
    organization: "Organization 1",
    phoneNumber: "+15555555555",
    status: "pending",
    title: "Director",
    type: "consumer",
    verificationCode: "123456",
  };
}
