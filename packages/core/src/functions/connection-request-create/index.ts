import { APIGatewayProxyHandler } from "aws-lambda";

import { ConnectionRequest } from "../../interfaces/connection-request";
import logger from "../../logger";
import { getConnectionRequestService } from "../../services";
import { apiResponse, applyMiddlewares } from "../api-helper";

export const handler = applyMiddlewares<APIGatewayProxyHandler>(async (event) => {
  const connectionRequest = JSON.parse(event.body!) as ConnectionRequest;
  await getConnectionRequestService().create(connectionRequest);
  logger.info(
    `Created connection request from ${connectionRequest.consumerEndpoint} to ${
      connectionRequest.providerEndpoint
    }.`,
  );
  return apiResponse(connectionRequest);
});
