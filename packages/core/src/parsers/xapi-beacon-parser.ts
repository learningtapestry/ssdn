import { APIGatewayProxyEvent } from "aws-lambda";
import get from "lodash/fp/get";

import { calculateIdentifier } from "../helpers/app-helper";
import { Format } from "../interfaces/format";
import LambdaEventParser from "./lambda-event-parser";

export default class XAPIBeaconParser extends LambdaEventParser {
  private content: any;

  constructor(public lambdaEvent: APIGatewayProxyEvent, defaultNamespace: string) {
    super(lambdaEvent, defaultNamespace);

    const content = JSON.parse(decodeURIComponent(this.queryParams.event));

    if (!content.id) {
      content.id = calculateIdentifier(content);
    }

    this.content = content;
  }

  protected interpretContent() {
    return this.content;
  }

  protected format(): Format {
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
