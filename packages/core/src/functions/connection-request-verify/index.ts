import { APIGatewayProxyHandler } from "aws-lambda";

import logger from "../../logger";
import { getConnectionRequestRepository } from "../../services";
import { apiResponse, applyMiddlewares, verifyAuthorization } from "../api-helper";

export const handler = applyMiddlewares<APIGatewayProxyHandler>(async (event) => {
  const id = event.pathParameters!.id;
  const connectionRequest = await getConnectionRequestRepository().get(id);
  verifyAuthorization(event, connectionRequest.acceptanceToken);
  logger.info(`Verified authorization for connection request ${id}.`);
  return apiResponse();
});
