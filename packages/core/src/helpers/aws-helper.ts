import APIGateway from "aws-sdk/clients/apigateway";
import { readEnv } from "./app-helper";

export async function getApiKey(keyId: string) {
  const apiGateway = new APIGateway({
    apiVersion: "2015-07-09",
    endpoint: readEnv("NUCLEUS_API_GATEWAY_ENDPOINT", undefined) || undefined,
  });
  return apiGateway.getApiKey({ apiKey: keyId, includeValue: true }).promise();
}
