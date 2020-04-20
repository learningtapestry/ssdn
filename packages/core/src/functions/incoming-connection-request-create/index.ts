import { APIGatewayProxyHandler } from "aws-lambda";

import { ConnectionRequest } from "../../interfaces/connection-request";
import logger from "../../logger";
import { getConnectionRequestService, getExchangeService } from "../../services";
import { apiResponse, applyMiddlewares } from "../api-helper";

export const handler = applyMiddlewares<APIGatewayProxyHandler>(async (event) => {
  const connectionRequest = JSON.parse(event.body!) as ConnectionRequest;
  await getExchangeService().verifyConnectionRequest(connectionRequest);
  logger.info(
    `Verified connection request ${connectionRequest.consumerEndpoint} - ${connectionRequest.id}`,
  );
  await getConnectionRequestService().createIncoming(connectionRequest);
  logger.info(
    `Created connection request ${connectionRequest.consumerEndpoint} - ${connectionRequest.id}`,
  );
  return apiResponse();
});
