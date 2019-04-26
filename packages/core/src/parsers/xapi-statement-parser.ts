import get from "lodash/fp/get";
import { calculateIdentifier, decode64, isBlank, toArray } from "../app-helper";
import LambdaEventParser from "./lambda-event-parser";

export default class XAPIStatementParser extends LambdaEventParser {
  protected interpretContent(): void {
    const content = get("isBase64Encoded")(this.lambdaEvent) ? decode64(this.body) : this.body;
    const parsedContent = isBlank(content) ? {} : JSON.parse(content);

    toArray(parsedContent).forEach((statement: any) => {
      statement.id = calculateIdentifier(statement);
    });

    return parsedContent;
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
    return get("statementId")(this.queryParams);
  }
}
