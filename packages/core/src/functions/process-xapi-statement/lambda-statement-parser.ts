/**
 * lambda-statement-parser.ts: Parses an API Gateway event as obtained from the lambda function and
 * returns an internal Nucleus event representation
 */

import get from "lodash/fp/get";
import { calculateIdentifier, decode64, isBlank, toArray, utcDate } from "../../app-helper";
import logger from "../../logger";

export default class LambdaStatementParser {
  public request: object;
  public queryParams: object;
  public headers: object;
  public body: any;

  constructor(public lambdaEvent: object) {
    this.request = get("requestContext")(lambdaEvent);
    this.queryParams = get("queryStringParameters")(lambdaEvent);
    this.headers = get("headers")(lambdaEvent);
    this.body = get("body")(lambdaEvent);
  }

  public parse() {
    logger.debug("Generating Nucleus event from Lambda: %j", this.lambdaEvent);

    return {
      content: this.interpretContent(),
      event: {
        date: utcDate(get("requestTimeEpoch")(this.request)),
        format: "xAPI",
        operation: get("httpMethod")(this.lambdaEvent),
        origin: `${get("Host")(this.headers)}${get("path")(this.request)}`,
        protocol: get("protocol")(this.request),
        representation: "REST",
        request: { headers: this.headers, queryStringParameters: this.queryParams },
        resource: "statements",
        resourceId: get("statementId")(this.queryParams),
      },
    };
  }

  private interpretContent() {
    const content = get("isBase64Encoded")(this.lambdaEvent) ? decode64(this.body) : this.body;
    const parsedContent = isBlank(content) ? {} : JSON.parse(content);

    toArray(parsedContent).forEach((statement: any) => {
      statement.id = calculateIdentifier(statement);
    });

    return parsedContent;
  }
}
