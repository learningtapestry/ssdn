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

export interface ProviderIssuedAccept {
  accepted: true;
  details: ProviderIssuedConnection;
}

export interface ProviderIssuedReject {
  accepted: false;
}

export type ProviderIssuedAcceptance = ProviderIssuedAccept | ProviderIssuedReject;

export interface StreamUpdate {
  endpoint?: string;
  stream: Stream;
  streamType: StreamType;
}
