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
  organization: string;
  type: string;
  verificationCode: string;
  acceptanceToken: string;
  creationDate: Date | string;
  formats: string[];
  status: ConnectionRequestStatus | IncomingConnectionRequestStatus;
  connection: {
    awsAccountId: string;
    ssdnId: string;
  };
}
