import {
  API,
  API_KEYS,
  AWS_NUCLEUS,
  BUCKETS,
  LAMBDAS,
  POLICIES,
  PUBLIC_METADATA,
  ROLES,
  STREAMS,
  TABLES,
  TOPICS,
} from "./aws-metadata-keys";

export type Factory<T> = (...params: any[]) => T;

export type MetadataKey =
  | API
  | API_KEYS
  | AWS_NUCLEUS
  | BUCKETS
  | LAMBDAS
  | POLICIES
  | PUBLIC_METADATA
  | ROLES
  | STREAMS
  | TABLES
  | TOPICS;

export interface MetadataValue<T extends MetadataKey> {
  value: string;
}
