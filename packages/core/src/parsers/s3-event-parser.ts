/**
 * s3-event-parser.ts: Parses an S3 creation event as obtained from the lambda function and
 * returns an internal Nucleus event representation
 */

import { S3EventRecord } from "aws-lambda";
import get from "lodash/fp/get";
import split from "lodash/fp/split";

import { isoDate } from "../helpers/app-helper";
import Event from "../interfaces/event";
import logger from "../logger";

export default class S3EventParser {
  public object: object;

  constructor(public event: S3EventRecord) {
    this.object = get("s3.object")(event);
  }

  public parse(): Event {
    logger.debug("Generating Nucleus event from Lambda: %j", this.event);

    return {
      content: get("s3.object")(this.event),
      event: {
        date: isoDate(get("eventTime")(this.event)),
        format: this.format(),
        namespace: this.namespace(),
        operation: "update",
        origin: get("s3.bucket.arn")(this.event),
        protocol: "S3",
        representation: this.representation(),
        request: this.buildRequest(),
        resource: this.resource(),
      },
    };
  }

  protected format() {
    return this.key()[1];
  }

  protected namespace() {
    return this.key()[0];
  }

  protected representation() {
    return get("eventName")(this.event);
  }

  protected resource() {
    return get("s3.bucket.name")(this.event);
  }

  private buildRequest() {
    return {
      requestParameters: get("requestParameters")(this.event),
      responseElements: get("responseElements")(this.event),
      userIdentity: get("userIdentity")(this.event),
    };
  }

  private key() {
    return split("/")(get("key")(this.object));
  }
}
