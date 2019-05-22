export enum StreamStatus {
  Active = "active",
  Paused = "paused",
  PausedExternal = "paused_external",
}

export interface Stream {
  namespace: string;
  format: string;
  status: StreamStatus;
}

export interface EndpointStream extends Stream {
  endpoint: string;
}
