import { APIGatewayProxyHandler } from "aws-lambda";

import { getConnectionService } from "../../aws-services";
import { StreamUpdate } from "../../interfaces/exchange";
import { apiResponse, applyMiddlewares } from "../api-helper";

export const handler = applyMiddlewares<APIGatewayProxyHandler>(async (event, context) => {
  const update = JSON.parse(event.body!) as StreamUpdate;
  const connectionService = getConnectionService();

  const userRole = getRoleName(event.requestContext.identity.userArn!);
  if (userRole.startsWith("nucleus_ex")) {
    await connectionService.updateStreamByExternal(
      userRole,
      update.endpoint,
      update.namespace,
      update.channel,
      update.status,
      update.type,
    );
    return apiResponse();
  }

  await connectionService.updateStream(
    update.endpoint,
    update.namespace,
    update.channel,
    update.status,
    update.type,
  );
  return apiResponse();
});

const getRoleName = (arn: string) => {
  return arn.split(":")[5].split("/")[1];
};
