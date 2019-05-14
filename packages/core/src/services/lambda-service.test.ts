import Lambda from "aws-sdk/clients/lambda";

import { fakeAws } from "../../test-support/jest-helper";
import LambdaService from "./lambda-service";

describe("LambdaService", () => {
  describe("invokeApiGatewayLambda", () => {
    it("invokes a lambda function with API Gateway parameters", async () => {
      const fakeLambda = fakeAws<Lambda>({
        invoke: jest.fn(() => Promise.resolve()),
      });
      const apiParameters = {
        pathParameters: {
          id: "1",
        },
      };
      const body = {
        operation: "test",
      };
      await new LambdaService(fakeLambda).invokeApiGatewayLambda(
        { value: "TestFunctionArn" },
        apiParameters,
        body,
      );
      expect(fakeLambda.impl.invoke!.mock.calls[0][0]).toEqual({
        FunctionName: "TestFunctionArn",
        InvocationType: "Event",
        Payload: '{"pathParameters":{"id":"1"},"body":"{\\"operation\\":\\"test\\"}"}',
      });
    });

    it("dismisses invocation errors", async () => {
      const fakeLambda = fakeAws<Lambda>({
        invoke: jest.fn(() => Promise.reject()),
      });
      expect(
        async () =>
          await new LambdaService(fakeLambda).invokeApiGatewayLambda(
            { value: "TestFunctionArn" },
            {},
          ),
      ).not.toThrowError();
    });
  });
});
