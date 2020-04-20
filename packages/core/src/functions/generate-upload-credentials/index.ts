import { APIGatewayProxyHandler } from "aws-lambda";
import filenamify from "filenamify";
import querystring, { ParsedUrlQuery } from "querystring";

import logger from "../../logger";
import { getFormatRepository, getUploadCredentialsService } from "../../services";

export const handler: APIGatewayProxyHandler = async (event) => {
  const params = querystring.parse(event.body!);
  const validationError = await validateParams(params);
  if (validationError) {
    return buildResponse({ message: validationError }, 400);
  }

  const credentials = await getUploadCredentialsService().generate(
    filenamify(params.client as string, { replacement: "__" }),
    params.format as string,
  );

  logger.info(`Generated credentials for ${params.client}/${params.format}`);

  return buildResponse(credentials, 200);
};

const validateParams = async (params: ParsedUrlQuery) => {
  if (!params.client || !params.format) {
    return "Both client and format need to be set";
  }

  try {
    await getFormatRepository().get(params.format as string);
  } catch {
    return `Format '${params.format}' is not recognized as valid`;
  }
};

const buildResponse = (results: object, statusCode: number) => {
  return {
    body: JSON.stringify(results),
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    statusCode,
  };
};
