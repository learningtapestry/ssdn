import { APIGatewayProxyHandler } from "aws-lambda";

import { StreamUpdate } from "../../interfaces/exchange";
import logger from "../../logger";
import { getConnectionRepository, getConnectionService } from "../../services";
import { apiResponse, applyMiddlewares, getRoleName } from "../api-helper";

export const handler = applyMiddlewares<APIGatewayProxyHandler>(async (event) => {
  const update = JSON.parse(event.body!) as StreamUpdate;
  const connectionRepository = getConnectionRepository();
  const connectionService = getConnectionService();

  const roleName = getRoleName(event);
  if (roleName.isExternal) {
    const connection = await connectionRepository.getByConnectionSecret(roleName.name);
    await connectionService.updateStream(connection, update.stream, update.streamType, false);
    logger.info(`Updated ${connection.endpoint} stream for external request from ${roleName}.`);
    return apiResponse();
  }

  await connectionService.updateStream(
    await connectionRepository.get(update.endpoint!),
    update.stream,
    update.streamType,
    true,
  );
  logger.info(`Updated ${update.endpoint} stream for internal request.`);
  return apiResponse();
});
