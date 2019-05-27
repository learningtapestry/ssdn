import get from "lodash/fp/get";

import { calculateIdentifier, decode64, toArray } from "../helpers/app-helper";
import { Format } from "../interfaces/format";
import ApiGatewayEventParser from "./api-gateway-event-parser";

export default class XAPIStatementParser extends ApiGatewayEventParser {
  protected interpretContent(): void {
    const content = get("isBase64Encoded")(this.lambdaEvent) ? decode64(this.body) : this.body;
    const parsedContent = content ? JSON.parse(content) : {};

    toArray(parsedContent).forEach((statement: any) => {
      statement.id = calculateIdentifier(statement);
    });

    return parsedContent;
  }

  protected format(): Format {
    return "xAPI";
  }

  protected representation() {
    return "REST";
  }

  protected resource() {
    return "statements";
  }

  protected resourceId() {
    return get("statementId")(this.queryParams);
  }
}
