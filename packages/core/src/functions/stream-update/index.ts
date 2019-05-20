import { APIGatewayProxyHandler } from "aws-lambda";

import { StreamUpdate } from "../../interfaces/exchange";
import { getConnectionRepository, getConnectionService } from "../../services";
import { apiResponse, applyMiddlewares, getRoleName } from "../api-helper";

export const handler = applyMiddlewares<APIGatewayProxyHandler>(async (event) => {
  const update = JSON.parse(event.body!) as StreamUpdate;
  const connectionRepository = getConnectionRepository();
  const connectionService = getConnectionService();

  const roleName = getRoleName(event);
  if (roleName.isExternal) {
    await connectionService.updateStream(
      await connectionRepository.getByConnectionSecret(roleName.name),
      update.stream,
      update.streamType,
      false,
    );
    return apiResponse();
  }

  await connectionService.updateStream(
    await connectionRepository.get(update.endpoint!),
    update.stream,
    update.streamType,
    true,
  );
  return apiResponse();
});
