import { CustomAuthorizerHandler } from "aws-lambda";
import APIGateway from "aws-sdk/clients/apigateway";

import TtlCache from "../../helpers/ttl-cache";
import logger from "../../logger";
import { getApiGatewayService } from "../../services";

const cache = new TtlCache<string, APIGateway.ApiKey>();

export const handler: CustomAuthorizerHandler = async (event, _context, _callback) => {
  const aid = event.queryStringParameters!.aid;

  if (!/^[a-zA-Z0-9-_]+$/.test(aid)) {
    logger.info(`Access denied for invalid aid ${aid}`);
    return deny("", event.methodArn);
  }

  let apiGatewayKey;

  try {
    apiGatewayKey = await cache.get(aid, () => getApiGatewayService().getApiKey({ value: aid }));
  } catch (error) {
    logger.info(`Aid not found: ${aid}.`);
    return deny("", event.methodArn);
  }

  if (!apiGatewayKey.enabled) {
    logger.info(`Aid disabled: ${aid}.`);
    return deny(apiGatewayKey.value as string, event.methodArn);
  }

  logger.info(`Success for aid ${aid}.`);
  return allow(apiGatewayKey.value as string, event.methodArn);
};

const deny = (apiKey: string, resource: string) => ({
  policyDocument: {
    Statement: [
      {
        Action: "execute-api:Invoke",
        Effect: "Deny",
        Resource: resource,
      },
    ],
    Version: "2012-10-17",
  },
  principalId: "",
  usageIdentifierKey: apiKey,
});

const allow = (apiKey: string, resource: string) => ({
  policyDocument: {
    Statement: [
      {
        Action: "execute-api:Invoke",
        Effect: "Allow",
        Resource: resource,
      },
    ],
    Version: "2012-10-17",
  },
  principalId: "",
  usageIdentifierKey: apiKey,
});
