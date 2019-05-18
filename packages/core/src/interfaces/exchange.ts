import { ProviderIssuedConnection } from "./connection";
import { Stream, StreamType } from "./stream";

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
  endpoint?: string;
  stream: Stream;
  streamType: StreamType;
}
