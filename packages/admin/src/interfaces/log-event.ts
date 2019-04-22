/**
 * log-event.ts: Interface that models a CloudWatchLogs event
 */

export default interface LogEvent {
  creationDate: Date;
  message: string;
}
