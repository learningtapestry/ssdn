import { APIGatewayProxyEvent } from "aws-lambda";

import { calculateIdentifier } from "../helpers/app-helper";
import LambdaEventParser from "./lambda-event-parser";

export default class XAPIBeaconParser extends LambdaEventParser {
  private content: any;

  constructor(public lambdaEvent: APIGatewayProxyEvent) {
    super(lambdaEvent);

    const content = JSON.parse(decodeURIComponent(this.queryParams.event));

    if (!content.id) {
      content.id = calculateIdentifier(content);
    }

    this.content = content;
  }

  protected interpretContent() {
    return this.content;
  }

  protected format() {
    return "xAPI";
  }

  protected representation() {
    return "REST";
  }

  protected resource() {
    return "statements";
  }

  protected resourceId() {
    return this.content.id;
  }
}
