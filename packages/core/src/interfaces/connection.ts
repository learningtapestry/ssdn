import { Stream } from "./stream";

export interface PublicNucleusMetadata {
  EventProcessorStream: string;
}

export interface ConnectionDetails {
  arn: string;
  awsAccountId: string;
  externalId: string;
  nucleusId: string;
  roleName: string;
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

/**
 * An established connection between two Nucleus instances.
 * `Connection` models always refer to the _other_ instance.
 * That is, if we have a connection stored on instance "Bob", it will always
 * refer to "Alice" (or any other instance but itself).
 */
export interface Connection {
  /**
   * Metadata about the other instance. For example, AWS resource ARNs.
   */
  metadata: PublicNucleusMetadata;
  /**
   * The endpoint to the otehr instance.
   */
  endpoint: string;
  /**
   * Whether the other instance is a consumer to this one.
   */
  isConsumer: boolean;
  /**
   * Whether the other instance is a provider for this one.
   */
  isProvider: boolean;
  /**
   * Connection details for the _other_ instance to connect to this one.
   * For example, the role name that the other instance uses when
   * issuing `assume-role`.
   * Also the nucleus ID of the other instance, the AWS account of the other
   * instance, etc.
   */
  connection: ConnectionDetails;
  /**
   * Connection details for _this_ instance to the connect to the other one.
   * In other words, a connection that exists externally.
   * For example, the role name that this instance will use when issuing
   * `assume-role`.
   */
  externalConnection: ExternalConnectionDetails;
  /**
   * Streams _provided_ by the other instance.
   */
  inputStreams: Stream[];
  /**
   * Streams _consumed_ by the other instance.
   */
  outputStreams: Stream[];
  /**
   * ISO 8601 string for the connection creation date.
   */
  creationDate: Date | string;
  /**
   * ISO 8601 string for the connection last update date.
   */
  updateDate: Date | string;
}
