import { Stream } from "./stream";

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

export interface ProviderIssuedConnectionDetails {
  connection: {
    awsAccountId: string;
    nucleusId: string;
  };
  externalConnection: ExternalConnectionDetails;
}

export interface ConsumerIssuedConnectionDetails {
  externalConnection: ExternalConnectionDetails;
}

export interface Connection {
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
