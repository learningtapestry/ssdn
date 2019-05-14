import { Stream } from "./stream";

export interface Connection {
  endpoint: string;
  isConsumer?: boolean;
  isProvider?: boolean;
  inputStreams?: Stream[];
  outputStreams?: Stream[];
  creationDate: Date | string;
  updateDate: Date | string;
}
