/**
 * api-gateway-event-parser.ts: Parses an API Gateway event as obtained from the lambda function and
 * returns an internal SSDN event representation
 */
import { APIGatewayProxyEvent } from "aws-lambda";
import get from "lodash/fp/get";

import { getLowercaseHeader } from "../functions/api-helper";
import { isoDate } from "../helpers/app-helper";
import Event from "../interfaces/event";
import logger from "../logger";

export default abstract class ApiGatewayEventParser {
  public event: APIGatewayProxyEvent;
  public defaultNamespace: string;
  public request: object;
  public queryParams: { [k: string]: string };
  public headers: { [k: string]: string };
  public body: any;

  constructor(public lambdaEvent: APIGatewayProxyEvent, defaultNamespace: string) {
    this.event = lambdaEvent;
    this.defaultNamespace = defaultNamespace;
    this.request = get("requestContext")(lambdaEvent);
    this.queryParams = get("queryStringParameters")(lambdaEvent);
    this.headers = get("headers")(lambdaEvent);
    this.body = get("body")(lambdaEvent);
  }

  public parse(): Event {
    logger.debug("Generating SSDN event from Lambda: %j", this.lambdaEvent);

    return {
      content: this.interpretContent(),
      event: {
        date: isoDate(get("requestTimeEpoch")(this.request)),
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

  protected abstract format(): string;

  protected abstract interpretContent(): any;

  protected namespace() {
    const eventNamespace = getLowercaseHeader(this.headers)("x-ssdn-namespace");
    if (eventNamespace) {
      return eventNamespace;
    }
    return this.defaultNamespace;
  }

  protected abstract representation(): string;

  protected abstract resource(): string;

  protected abstract resourceId(): string | undefined;
}
