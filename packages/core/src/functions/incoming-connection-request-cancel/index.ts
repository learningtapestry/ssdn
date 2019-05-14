import { APIGatewayProxyHandler } from "aws-lambda";

import { getConnectionRequestRepository } from "../../aws-services";
import { NucleusError } from "../../errors/nucleus-error";
import { ConnectionRequestStatus } from "../../interfaces/connection-request";
import { ConnectionRequestCancel } from "../../interfaces/exchange";
import { apiResponse, applyMiddlewares } from "../api-helper";

export const handler = applyMiddlewares<APIGatewayProxyHandler>(async (event) => {
  const cancelation = JSON.parse(event.body!) as ConnectionRequestCancel;

  if (event.requestContext.authorizer!.principalId !== cancelation.endpoint) {
    throw new NucleusError("Request is not authorized for this method.", 401);
  }

  await getConnectionRequestRepository().updateIncomingStatus(
    cancelation.endpoint,
    cancelation.id,
    ConnectionRequestStatus.Canceled,
  );

  return apiResponse();
});
