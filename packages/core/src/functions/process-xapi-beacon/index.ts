import { APIGatewayProxyHandler } from "aws-lambda";
import has from "lodash/fp/has";

import { AWS_SSDN } from "../../interfaces/aws-metadata-keys";
import XAPIBeaconParser from "../../parsers/xapi-beacon-parser";
import { getEventRepository, getMetadataService } from "../../services";
import XAPIStatementService from "../../services/xapi-statement-service";
import XAPIValidator from "../../validators/xapi-validator";

export const handler: APIGatewayProxyHandler = async (event) => {
  const namespace = await getMetadataService().getMetadataValue(AWS_SSDN.namespace);
  const results = await XAPIStatementService.process(
    new XAPIBeaconParser(event, namespace.value).parse(),
    new XAPIValidator(),
    getEventRepository(),
  );
  const hasErrors = has("errors")(results);

  return buildResponse(hasErrors ? 422 : 200);
};

const buildResponse = (statusCode: number) => {
  return {
    body: "",
    headers: { "X-Experience-API-Version": "1.0.3" },
    statusCode,
  };
};
