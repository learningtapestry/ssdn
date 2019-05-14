import { APIGatewayProxyHandler } from "aws-lambda";

import { getConnectionRequestService } from "../../aws-services";
import { ConnectionRequest } from "../../interfaces/connection-request";
import { apiResponse, applyMiddlewares } from "../api-helper";

export const handler = applyMiddlewares<APIGatewayProxyHandler>(async (event) => {
  const connectionRequest = JSON.parse(event.body!) as ConnectionRequest;
  await getConnectionRequestService().create(connectionRequest);
  return apiResponse(connectionRequest);
});
