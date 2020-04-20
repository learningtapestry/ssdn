import { APIGatewayProxyHandler } from "aws-lambda";

import { ConnectionRequestAcceptance } from "../../interfaces/exchange";
import logger from "../../logger";
import { getConnectionRequestRepository, getConnectionService } from "../../services";
import { apiResponse, applyMiddlewares } from "../api-helper";

export const handler = applyMiddlewares<APIGatewayProxyHandler>(async (event) => {
  const acceptance = JSON.parse(event.body!) as ConnectionRequestAcceptance;
  const connectionRequest = await getConnectionRequestRepository().getIncoming(
    acceptance.endpoint,
    acceptance.id,
  );
  if (acceptance.accepted) {
    await getConnectionService().createForConsumerRequest(connectionRequest);
    logger.info(`Created connection for request ${acceptance.endpoint} - ${acceptance.id}.`);
  } else {
    await getConnectionService().rejectConsumerRequest(connectionRequest);
    logger.info(`Refused connection for request ${acceptance.endpoint} - ${acceptance.id}.`);
  }
  return apiResponse();
});
