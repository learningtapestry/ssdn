import { Format } from "./format";

export interface EventMetadata {
  date: string;
  format: Format;
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
    endpoint: string;
  };
}
