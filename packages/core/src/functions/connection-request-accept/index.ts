import { APIGatewayProxyHandler } from "aws-lambda";

import { ConsumerIssuedConnection } from "../../interfaces/connection";
import { ProviderIssuedAcceptance } from "../../interfaces/exchange";
import logger from "../../logger";
import {
  getConnectionRequestRepository,
  getConnectionRequestService,
  getConnectionService,
  getMetadataService,
} from "../../services";
import { apiResponse, applyMiddlewares, verifyAuthorization } from "../api-helper";

export const handler = applyMiddlewares<APIGatewayProxyHandler>(async (event) => {
  const connectionRequests = getConnectionRequestRepository();
  const id = event.pathParameters!.id;
  const connectionRequest = await connectionRequests.get(id);
  verifyAuthorization(event, connectionRequest.acceptanceToken);
  logger.info(`Verified authorization for id ${id}.`);

  const acceptance = JSON.parse(event.body!) as ProviderIssuedAcceptance;

  if (!acceptance.accepted) {
    await getConnectionRequestService().receiveProviderRejection(connectionRequest);
    logger.info(`Received rejection for id ${id}.`);
    return apiResponse();
  }

  const connection = await getConnectionService().createForProviderAcceptance(
    connectionRequest,
    acceptance.details,
  );

  logger.info(`Received acceptance for id ${id}.`);

  const response: ConsumerIssuedConnection = {
    externalConnection: {
      arn: connection.connection.arn,
      externalId: connection.connection.externalId,
    },
    metadata: await getMetadataService().getPublicMetadata(),
  };
  return apiResponse(response);
});
