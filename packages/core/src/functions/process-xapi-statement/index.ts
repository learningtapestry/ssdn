import { APIGatewayProxyHandler } from "aws-lambda";
import get from "lodash/fp/get";
import has from "lodash/fp/has";
import isEmpty from "lodash/fp/isEmpty";
import trim from "lodash/fp/trim";

import { readEnv } from "../../helpers/app-helper";
import XAPIStatementParser from "../../parsers/xapi-statement-parser";
import KinesisRepository from "../../repositories/kinesis-repository";
import StatementService from "../../services/statement-service";
import XAPIValidator from "../../validators/xapi-validator";

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestErrors = validateRequest(event);
  if (!isEmpty(requestErrors)) {
    return buildResponse(
      {
        errors: requestErrors,
        message: "Some arguments in the request are invalid",
      },
      400,
    );
  }

  const results = await StatementService.process(
    new XAPIStatementParser(event).parse(),
    new XAPIValidator(),
    new KinesisRepository(readEnv("NUCLEUS_EVENT_PROCESSOR_STREAM_NAME")),
  );
  const hasErrors = has("errors")(results);

  return buildResponse(results, hasErrors ? 422 : 200);
};

const validateRequest = (event: object) => {
  const errors = [];
  const xAPIVersion = trim(get("headers.X-Experience-API-Version")(event));
  if (!/^1\.0(\.\d{1,2})?$/.test(xAPIVersion)) {
    errors.push(`Unsupported xAPI version (${xAPIVersion})`);
  }

  return errors;
};

const buildResponse = (results: object, statusCode: number) => {
  return {
    body: JSON.stringify(results),
    headers: { "X-Experience-API-Version": "1.0.3" },
    statusCode,
  };
};
