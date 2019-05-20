import { APIGatewayProxyHandler } from "aws-lambda";

import { ConnectionRequest } from "../../interfaces/connection-request";
import { getConnectionRequestService, getExchangeService } from "../../services";
import { apiResponse, applyMiddlewares } from "../api-helper";

export const handler = applyMiddlewares<APIGatewayProxyHandler>(async (event) => {
  const connectionRequest = JSON.parse(event.body!) as ConnectionRequest;
  await getExchangeService().verifyConnectionRequest(connectionRequest);
  await getConnectionRequestService().createIncoming(connectionRequest);
  return apiResponse();
});
