import { Channel } from "./channel";

export default interface Event {
  content: any;
  event: {
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
  };
  source?: {
    nucleusId: string;
  };
}
