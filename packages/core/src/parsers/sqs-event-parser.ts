/**
 * sqs-event-parser.ts: Parses an SQS message event as obtained from the lambda function and
 * returns an internal SSDN event representation
 */

import { SQSRecord } from "aws-lambda";
import get from "lodash/fp/get";

import { isoDate } from "../helpers/app-helper";
import Event from "../interfaces/event";
import logger from "../logger";

export default class SQSEventParser {
  constructor(public event: SQSRecord, public namespace: string) {}

  public parse(): Event {
    logger.debug("Generating SSDN event from Lambda: %j", this.event);

    return {
      content: get("body")(this.event),
      event: {
        date: isoDate(parseInt(get("attributes.SentTimestamp")(this.event), 10)),
        format: "unknown",
        namespace: this.namespace,
        operation: "create",
        origin: get("eventSourceARN")(this.event),
        protocol: "HTTP/1.1",
        representation: get("eventSource")(this.event),
        request: {
          messageAttributes: get("messageAttributes")(this.event),
          messageId: get("messageId")(this.event),
          senderId: get("attributes.SenderId")(this.event),
        },
        resource: get("messageId")(this.event),
      },
    };
  }
}
