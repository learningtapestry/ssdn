import { APIGatewayProxyHandler } from "aws-lambda";
import get from "lodash/fp/get";
import has from "lodash/fp/has";

import { AWS_SSDN } from "../../interfaces/aws-metadata-keys";
import CaliperEnvelopeParser from "../../parsers/caliper-envelope-parser";
import { getEventRepository, getMetadataService } from "../../services";
import CaliperEnvelopeService from "../../services/caliper-envelope-service";
import CaliperValidator from "../../validators/caliper-validator";
import { getLowercaseHeader } from "../api-helper";

export const handler: APIGatewayProxyHandler = async (event) => {
  if (!hasValidContentType(event)) {
    return buildResponse({ message: "Content type must be 'application/json'" }, 415);
  }

  const namespace = await getMetadataService().getMetadataValue(AWS_SSDN.namespace);
  const results = await CaliperEnvelopeService.process(
    new CaliperEnvelopeParser(event, namespace.value).parse(),
    new CaliperValidator(),
    getEventRepository(),
  );

  return buildResponse(results, has("errors")(results) ? 400 : 201);
};

const hasValidContentType = (event: object) => {
  const contentType = getLowercaseHeader(get("headers")(event))("content-type");

  return contentType === "application/json";
};

const buildResponse = (results: object | undefined, statusCode: number) => {
  return {
    body: results ? JSON.stringify(results) : "",
    statusCode,
  };
};
