import { APIGatewayProxyHandler } from "aws-lambda";
import get from "lodash/fp/get";
import has from "lodash/fp/has";
import isEmpty from "lodash/fp/isEmpty";
import trim from "lodash/fp/trim";

import { readEnv } from "../../helpers/app-helper";
import XAPIBeaconParser from "../../parsers/xapi-beacon-parser";
import KinesisRepository from "../../repositories/kinesis-repository";
import StatementService from "../../services/statement-service";
import XAPIValidator from "../../validators/xapi-validator";

export const handler: APIGatewayProxyHandler = async (event) => {
  const results = await StatementService.process(
    new XAPIBeaconParser(event).parse(),
    new XAPIValidator(),
    new KinesisRepository(readEnv("NUCLEUS_EVENT_PROCESSOR_STREAM_NAME")),
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
