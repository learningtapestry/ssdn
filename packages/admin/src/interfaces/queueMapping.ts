/**
 * queueMapping.ts: Interface that models an EventSourceMapping object
 */

export default interface QueueMapping {
  arn: string;
  modificationDate: Date;
  status: string;
  uuid: string;
}
