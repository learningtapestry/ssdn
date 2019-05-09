import { CustomAuthorizerHandler } from "aws-lambda";

import { getApiKey } from "../../helpers/aws-helper";

export const handler: CustomAuthorizerHandler = async (event, _context, _callback) => {
  const aid = event.queryStringParameters!.aid;

  if (!/^[a-zA-Z0-9-_]+$/.test(aid)) {
    return deny("", event.methodArn);
  }

  let apiGatewayKey;

  try {
    apiGatewayKey = await getApiKey(aid);
  } catch (error) {
    return deny("", event.methodArn);
  }

  if (!apiGatewayKey.enabled) {
    return deny(apiGatewayKey.value as string, event.methodArn);
  }

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
