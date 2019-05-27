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
    // API Gateway specific elements
    headers?: object;
    queryStringParameters?: {
      [k: string]: string;
    };
    // S3 specific elements
    requestParameters?: object;
    responseElements?: object;
    userIdentity?: object;
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
