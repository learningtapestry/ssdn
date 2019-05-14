import { APIGatewayProxyEvent } from "aws-lambda";

import { calculateIdentifier } from "../helpers/app-helper";
import { Channel } from "../interfaces/channel";
import LambdaEventParser from "./lambda-event-parser";

import get from "lodash/fp/get";

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

  protected channel(): Channel {
    return "XAPI";
  }

  protected interpretContent() {
    return this.content;
  }

  protected format() {
    return "xAPI";
  }

  protected namespace() {
    const queryStringNamespace = get("ns")(this.queryParams);
    if (queryStringNamespace) {
      return decodeURIComponent(queryStringNamespace);
    }
    return super.namespace();
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
