import {
  API,
  API_KEYS,
  AWS_NUCLEUS,
  BUCKETS,
  LAMBDAS,
  POLICIES,
  PUBLIC_METADATA,
  STREAMS,
  TABLES,
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
  | STREAMS
  | TABLES;

export interface MetadataValue<T extends MetadataKey> {
  value: string;
}
