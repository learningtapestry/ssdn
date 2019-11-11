import get from "lodash/fp/get";

import { decode64 } from "../helpers/app-helper";
import ApiGatewayEventParser from "./api-gateway-event-parser";

export default class CaliperEnvelopeParser extends ApiGatewayEventParser {
  protected interpretContent(): void {
    const content = get("isBase64Encoded")(this.lambdaEvent) ? decode64(this.body) : this.body;

    return content ? JSON.parse(content) : {};
  }

  protected format() {
    return "Caliper";
  }

  protected representation() {
    return "REST";
  }

  protected resource() {
    return "envelopes";
  }

  protected resourceId() {
    return undefined;
  }
}
