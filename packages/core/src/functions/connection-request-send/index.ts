import { APIGatewayProxyHandler } from "aws-lambda";

import logger from "../../logger";
import { getConnectionRequestRepository, getConnectionRequestService } from "../../services";
import { apiResponse, applyMiddlewares } from "../api-helper";

export const handler = applyMiddlewares<APIGatewayProxyHandler>(async (event) => {
  const id = event.pathParameters!.id;
  const connectionRequest = await getConnectionRequestRepository().get(id);
  await getConnectionRequestService().sendConnectionRequest(connectionRequest);
  logger.info(
    `Sent connection request ${connectionRequest.id} to ${connectionRequest.providerEndpoint}.`,
  );
  return apiResponse();
});
