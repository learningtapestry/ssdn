import { Channel } from "./channel";
import { ProviderIssuedConnection } from "./connection";
import { StreamStatus } from "./stream";

export interface ConnectionRequestAcceptance {
  endpoint: string;
  id: string;
  accepted: boolean;
}

export interface ConnectionRequestCancel {
  endpoint: string;
  id: string;
}

export interface ProviderIssuedAcceptance {
  accepted: boolean;
  details: ProviderIssuedConnection;
}

export interface StreamUpdate {
  endpoint: string;
  namespace: string;
  channel: Channel;
  status: StreamStatus;
  type: "input" | "output";
}
