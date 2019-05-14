import { Channel } from "./channel";
import { ProviderIssuedConnectionDetails } from "./connection";
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
  details: ProviderIssuedConnectionDetails;
}

export interface StreamUpdate {
  endpoint: string;
  namespace: string;
  channel: Channel;
  status: StreamStatus;
  type: "input" | "output";
}
