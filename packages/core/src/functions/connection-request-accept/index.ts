import { APIGatewayProxyHandler } from "aws-lambda";

import {
  getConnectionRequestRepository,
  getConnectionRequestService,
  getConnectionService,
} from "../../aws-services";
import { ConsumerIssuedConnectionDetails } from "../../interfaces/connection";
import { ProviderIssuedAcceptance } from "../../interfaces/exchange";
import { apiResponse, applyMiddlewares, verifyAuthorization } from "../api-helper";

export const handler = applyMiddlewares<APIGatewayProxyHandler>(async (event) => {
  const connectionRequests = getConnectionRequestRepository();
  const connectionRequest = await connectionRequests.get(event.pathParameters!.id);
  verifyAuthorization(event, connectionRequest.acceptanceToken);

  const acceptance = JSON.parse(event.body!) as ProviderIssuedAcceptance;

  if (!acceptance.accepted) {
    await getConnectionRequestService().receiveProviderRejection(connectionRequest);
    return apiResponse();
  }

  const connection = await getConnectionService().createForProviderAcceptance(
    connectionRequest,
    acceptance.details,
  );

  const response: ConsumerIssuedConnectionDetails = {
    externalConnection: {
      arn: connection.connection.arn,
      externalId: connection.connection.externalId,
    },
  };
  return apiResponse(response);
});
