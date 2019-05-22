import { Format } from "./format";

export enum StreamType {
  Input = "input",
  Output = "output",
}

export enum StreamStatus {
  Active = "active",
  Paused = "paused",
  PausedExternal = "paused_external",
}

export interface Stream {
  namespace: string;
  format: Format;
  status: StreamStatus;
}
