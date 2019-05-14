/**
 * lambda-statement-parser.ts: Parses an API Gateway event as obtained from the lambda function and
 * returns an internal Nucleus event representation
 */
import { APIGatewayProxyEvent } from "aws-lambda";
import get from "lodash/fp/get";

import { readEnv, utcDate } from "../helpers/app-helper";
import { Channel } from "../interfaces/channel";
import Event from "../interfaces/event";
import logger from "../logger";

export default abstract class LambdaEventParser {
  public event: APIGatewayProxyEvent;
  public request: object;
  public queryParams: { [k: string]: string };
  public headers: object;
  public body: any;

  constructor(public lambdaEvent: APIGatewayProxyEvent) {
    this.event = lambdaEvent;
    this.request = get("requestContext")(lambdaEvent);
    this.queryParams = get("queryStringParameters")(lambdaEvent);
    this.headers = get("headers")(lambdaEvent);
    this.body = get("body")(lambdaEvent);
  }

  public parse(): Event {
    logger.debug("Generating Nucleus event from Lambda: %j", this.lambdaEvent);

    return {
      content: this.interpretContent(),
      event: {
        channel: this.channel(),
        date: utcDate(get("requestTimeEpoch")(this.request)),
        format: this.format(),
        namespace: this.namespace(),
        operation: get("httpMethod")(this.lambdaEvent),
        origin: `${get("Host")(this.headers)}${get("path")(this.request)}`,
        protocol: get("protocol")(this.request),
        representation: this.representation(),
        request: { headers: this.headers, queryStringParameters: this.queryParams },
        resource: this.resource(),
        resourceId: this.resourceId(),
      },
    };
  }

  protected abstract channel(): Channel;

  protected abstract format(): string;

  protected abstract interpretContent(): any;

  protected namespace() {
    const eventNamespace = get("X-Nucleus-Namespace")(this.headers);
    if (eventNamespace) {
      return eventNamespace;
    }
    return readEnv("NUCLEUS_NAMESPACE");
  }

  protected abstract representation(): string;

  protected abstract resource(): string;

  protected abstract resourceId(): string | undefined;
}
