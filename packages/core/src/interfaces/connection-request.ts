import { Channel } from "./channel";

export enum ConnectionRequestStatus {
  Created = "created",
  Pending = "pending",
  Accepted = "accepted",
  Rejected = "rejected",
  Canceled = "canceled",
}

export enum IncomingConnectionRequestStatus {
  AcceptedPending = "accepted_pending",
  RejectedPending = "rejected_pending",
}

export interface ConnectionRequest {
  id: string;
  consumerEndpoint: string;
  providerEndpoint: string;
  namespace: string;
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  email: string;
  phoneNumber: string;
  extension?: string;
  type: string;
  verificationCode: string;
  acceptanceToken: string;
  creationDate: Date | string;
  channels: Channel[];
  status: ConnectionRequestStatus | IncomingConnectionRequestStatus;
  connection: {
    awsAccountId: string;
    nucleusId: string;
  };
}
