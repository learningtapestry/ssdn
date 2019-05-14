export enum StreamStatus {
  Active = "active",
  Paused = "paused",
  PausedExternal = "paused_external",
}

export interface Stream {
  namespace: string;
  channel: string;
  status: StreamStatus;
}

export interface EndpointStream extends Stream {
  endpoint: string;
}
