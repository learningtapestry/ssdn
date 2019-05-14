import {
  API,
  API_KEYS,
  LAMBDAS,
  POLICIES,
  PUBLIC_METADATA,
  STREAMS,
  TABLES,
} from "./aws-metadata-keys";

export type Factory<T> = (...params: any[]) => T;

export type MetadataKey = API | API_KEYS | TABLES | STREAMS | LAMBDAS | POLICIES | PUBLIC_METADATA;

export interface MetadataValue<T extends MetadataKey> {
  value: string;
}
