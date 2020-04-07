export interface EventMetadata {
  date: string;
  format: string;
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
    } | null;
    // S3 specific elements
    requestParameters?: object;
    responseElements?: object;
    userIdentity?: object;
    // SQS specific elements
    messageAttributes?: object;
    messageId?: string;
    senderId?: string;
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
