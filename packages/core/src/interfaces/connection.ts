import { Stream } from "./stream";

export interface PublicNucleusMetadata {
  EventProcessorStream: string;
}

export interface ConnectionDetails {
  arn: string;
  awsAccountId: string;
  externalId: string;
  nucleusId: string;
}

export interface ExternalConnectionDetails {
  arn: string;
  externalId: string;
}

export interface ProviderIssuedConnection {
  connection: {
    awsAccountId: string;
    nucleusId: string;
  };
  externalConnection: ExternalConnectionDetails;
  metadata: PublicNucleusMetadata;
}

export interface ConsumerIssuedConnection {
  externalConnection: ExternalConnectionDetails;
  metadata: PublicNucleusMetadata;
}

export interface Connection {
  metadata: PublicNucleusMetadata;
  endpoint: string;
  isConsumer: boolean;
  isProvider: boolean;
  connection: ConnectionDetails;
  externalConnection: ExternalConnectionDetails;
  inputStreams: Stream[];
  outputStreams: Stream[];
  creationDate: Date | string;
  updateDate: Date | string;
}
