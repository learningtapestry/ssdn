import slugify from "@sindresorhus/slugify";
import { APIGatewayProxyHandler } from "aws-lambda";
import get from "lodash/fp/get";
import { Format } from "../../interfaces/format";
import { getUploadCredentialsService } from "../../services";

export const handler: APIGatewayProxyHandler = async (event) => {
  const format = parseFormat(get("pathParameters.format")(event));
  if (!format) {
    return buildResponse(
      {
        message: `Format '${get("pathParameters.format")(event)}' is not recognized as valid`,
      },
      400,
    );
  }

  const credentials = await getUploadCredentialsService().generate(
    slugify(get("pathParameters.client")(event)),
    format,
  );

  return buildResponse(credentials, 200);
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
