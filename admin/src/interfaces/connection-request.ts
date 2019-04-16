/**
 * connection-request.ts: Interface that models a connection request sent to a provider
 */

export default interface ConnectionRequest {
  id: string;
  endpoint: string;
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  email: string;
  phoneNumber: string;
  extension?: string;
  type: string;
  verificationCode: string;
  status: string;
  creationDate: Date | string;
}
