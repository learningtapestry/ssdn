import { APIGatewayProxyEvent } from "aws-lambda";
import Lambda from "aws-sdk/clients/lambda";

import { LAMBDAS } from "../interfaces/aws-metadata-keys";
import { MetadataValue } from "../interfaces/base-types";
import logger from "../logger";

export default class LambdaService {
  private client: Lambda;

  constructor(client: Lambda) {
    this.client = client;
  }

  public async invokeApiGatewayLambda(
    functionArn: MetadataValue<LAMBDAS>,
    eventData: Partial<APIGatewayProxyEvent> = {},
    body?: any,
  ) {
    if (body && typeof body !== "string") {
      body = JSON.stringify(body);
    }
    const payload = {
      ...eventData,
      body,
    };
    try {
      await this.client
        .invoke({
          FunctionName: functionArn.value,
          InvocationType: "Event",
          Payload: JSON.stringify(payload),
        })
        .promise();
    } catch (e) {
      // Something went wrong with this invokation, but we're dismissing the results.
      logger.error(e);
    }
  }
}
