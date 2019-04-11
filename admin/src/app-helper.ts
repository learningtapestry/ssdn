/**
 * app-helper.ts: General module containing utility functions
 */

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
