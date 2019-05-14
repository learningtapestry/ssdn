import { APIGatewayProxyHandler } from "aws-lambda";
import Axios from "axios";

import { getConnectionRequestRepository } from "../../aws-services";
import { ConnectionRequestStatus } from "../../interfaces/connection-request";
import ConnectionRequestService from "../../services/connection-request-service";
import { incomingRequestsCancelPath } from "../../services/paths";
import { applyMiddlewares } from "../api-helper";

export const handler = applyMiddlewares<APIGatewayProxyHandler>(async (event) => {
  const id = event.pathParameters!.id;
  const repo = getConnectionRequestRepository();
  const connectionRequest = await repo.get(id);

  await Axios.post(incomingRequestsCancelPath(connectionRequest.providerEndpoint), {
    endpoint: connectionRequest.consumerEndpoint,
    id,
  });

  await repo.updateStatus(id, ConnectionRequestStatus.Canceled);

  return {
    body: "",
    statusCode: 200,
  };
});
