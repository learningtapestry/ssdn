import { Channel } from "./channel";

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
  channel: Channel;
  status: StreamStatus;
}
