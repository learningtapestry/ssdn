import { APIGatewayProxyHandler } from "aws-lambda";

import { ConnectionRequest } from "../../interfaces/connection-request";
import { getConnectionRequestService } from "../../services";
import { apiResponse, applyMiddlewares } from "../api-helper";

export const handler = applyMiddlewares<APIGatewayProxyHandler>(async (event) => {
  const connectionRequest = JSON.parse(event.body!) as ConnectionRequest;
  await getConnectionRequestService().create(connectionRequest);
  return apiResponse(connectionRequest);
});
