import { APIGatewayProxyEvent } from "aws-lambda";
import { Output } from "aws-sdk/clients/cloudformation";
import Lambda from "aws-sdk/clients/lambda";

import { getLambda } from "../aws-clients";
import CloudformationService from "./cloudformation-service";

type OptionalProxy<T> = { [P in keyof T]?: T[P] };

export default class LambdaService {
  private cloudformation: CloudformationService;
  private client: Lambda;

  constructor(cloudformation: CloudformationService, client: Lambda = getLambda()) {
    this.cloudformation = cloudformation;
    this.client = client;
  }

  public async invokeApiGatewayLambda(
    functionName: string,
    eventData: OptionalProxy<APIGatewayProxyEvent> = {},
    body?: any,
  ) {
    const stack = await this.cloudformation.getCurrentStack();
    const functionArn = stack.Outputs!.find((o: Output) => o.OutputKey === functionName)!
      .OutputValue!;
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
          FunctionName: functionArn,
          InvocationType: "Event",
          Payload: JSON.stringify(payload),
        })
        .promise();
    } catch (e) {
      // Something went wrong with this invokation, but we're dismissing the results.
    }
  }
}
