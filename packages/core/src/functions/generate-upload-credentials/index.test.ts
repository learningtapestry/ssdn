import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

import { buildUploadCredentials } from "../../../test-support/factories";
import { fakeImpl, mocked } from "../../../test-support/jest-helper";
import uploadCredentialsEvent from "../../../test-support/lambda-events/get-upload-credentials-event.json";
import DynamoFormatRepository from "../../repositories/dynamo-format-repository";
import { getFormatRepository, getUploadCredentialsService } from "../../services";
import UploadCredentialsService from "../../services/upload-credentials-service";
import { handler } from "./index";

jest.mock("../../services");

const uploadCredentialsService = fakeImpl<UploadCredentialsService>({
  generate: jest.fn().mockResolvedValue(buildUploadCredentials()),
});

const fakeFormatRepo = fakeImpl<DynamoFormatRepository>({
  get: jest.fn((name) =>
    name === "xAPI" ? Promise.resolve({ name: "xAPI" }) : Promise.reject("Error"),
  ),
});

mocked(getUploadCredentialsService).mockReturnValue(uploadCredentialsService);
mocked(getFormatRepository).mockReturnValue(fakeFormatRepo);

describe("GenerateUploadCredentialsFunction", () => {
  it("generates temporary credentials when receives valid parameters", async () => {
    const result = (await handler(
      (uploadCredentialsEvent as unknown) as APIGatewayProxyEvent,
      {} as Context,
      () => {},
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toEqual(200);
    expect(result.body).toEqual(JSON.stringify(buildUploadCredentials()));
  });

  it("returns error when client or format are not set", async () => {
    const invalidFormatEvent = {
      ...uploadCredentialsEvent,
      body: "format=xAPI",
    };

    const result = (await handler(
      (invalidFormatEvent as unknown) as APIGatewayProxyEvent,
      {} as Context,
      () => {},
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toEqual(400);
    expect(result.body).toEqual(
      JSON.stringify({ message: "Both client and format need to be set" }),
    );
  });

  it("returns error when format is not valid", async () => {
    const invalidFormatEvent = {
      ...uploadCredentialsEvent,
      body: "client=ssdn.learning-tapestry.com&format=Invalid",
    };

    const result = (await handler(
      (invalidFormatEvent as unknown) as APIGatewayProxyEvent,
      {} as Context,
      () => {},
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toEqual(400);
    expect(result.body).toEqual(
      JSON.stringify({ message: "Format 'Invalid' is not recognized as valid" }),
    );
  });
});
