import { APIGatewayProxyHandler } from "aws-lambda";

import { getConnectionRequestRepository, getConnectionService } from "../../aws-services";
import { ConnectionRequestAcceptance } from "../../interfaces/exchange";
import { apiResponse, applyMiddlewares } from "../api-helper";

export const handler = applyMiddlewares<APIGatewayProxyHandler>(async (event) => {
  const acceptance = JSON.parse(event.body!) as ConnectionRequestAcceptance;
  const connectionRequest = await getConnectionRequestRepository().getIncoming(
    acceptance.endpoint,
    acceptance.id,
  );
  if (acceptance.accepted) {
    await getConnectionService().createForConsumerRequest(connectionRequest);
  } else {
    await getConnectionService().rejectConsumerRequest(connectionRequest);
  }
  return apiResponse();
});
