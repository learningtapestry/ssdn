import slugify from "@sindresorhus/slugify";
import { APIGatewayProxyHandler } from "aws-lambda";
import querystring, { ParsedUrlQuery } from "querystring";
import { Format } from "../../interfaces/format";
import { getUploadCredentialsService } from "../../services";

export const handler: APIGatewayProxyHandler = async (event) => {
  const params = querystring.parse(event.body!);
  const validationError = validateParams(params);
  if (validationError) {
    return buildResponse({ message: validationError }, 400);
  }

  const credentials = await getUploadCredentialsService().generate(
    slugify(params.client as string),
    parseFormat(params.format as string),
  );

  return buildResponse(credentials, 200);
};

const validateParams = (params: ParsedUrlQuery) => {
  if (!params.client || !params.format) {
    return "Both client and format need to be set";
  }

  if (!parseFormat(params.format as string)) {
    return `Format '${params.format}' is not recognized as valid`;
  }
};

const parseFormat = (format: string): Format => {
  const formats = { xapi: "xAPI", "x-api": "xAPI", caliper: "Caliper" };

  return (formats as any)[slugify(format)];
};

const buildResponse = (results: object, statusCode: number) => {
  return {
    body: JSON.stringify(results),
    statusCode,
  };
};
