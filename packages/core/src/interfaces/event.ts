import { Channel } from "./channel";

export interface EventMetadata {
  channel: Channel;
  date: string;
  format: string;
  namespace: string;
  operation: any;
  origin: string;
  protocol: any;
  representation: string;
  request: {
    headers: object;
    queryStringParameters: {
      [k: string]: string;
    };
  };
  resource: string;
  resourceId?: string;
}

export default interface Event {
  content: any;
  event: EventMetadata;
  source?: {
    nucleusId: string;
  };
}
