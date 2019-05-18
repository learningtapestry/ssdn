import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";

import { NucleusError } from "../errors/nucleus-error";
import { apiResponse, applyMiddlewares, getRoleName, verifyAuthorization } from "./api-helper";

describe("ApiHelper", () => {
  describe("apiResponse", () => {
    it("builds an API Gateway response", () => {
      const payload = { error: "NotFound" };
      const response = apiResponse(payload, 404);
      expect(response.body).toEqual('{"error":"NotFound"}');
      expect(response.statusCode).toEqual(404);
    });
  });

  describe("applyMiddlewares", () => {
    describe("cors", () => {
      it("adds cors headers", async () => {
        const handler = () => Promise.resolve({ body: "", statusCode: 200 });
        const wrappedResponse = await applyMiddlewares(handler)({ httpMethod: "POST" });
        expect(wrappedResponse.headers).toEqual({ "Access-Control-Allow-Origin": "*" });
      });
    });

    describe("nucleus-error", () => {
      it("forwards non-nucleus errors", async () => {
        const handler = () => Promise.reject(new Error("Test"));
        const wrappedResponse = applyMiddlewares(handler)({});
        await expect(wrappedResponse).rejects.toBeTruthy();
      });

      it("transforms nucleus errors", async () => {
        const handler = () => Promise.reject(new NucleusError("NotFound", 404));
        const wrappedResponse = applyMiddlewares(handler)({});
        await expect(wrappedResponse).resolves.toBeTruthy();
        await expect(wrappedResponse).resolves.toEqual({
          body: '{"errors":[{"detail":"NotFound","status":"404","title":"NucleusError"}]}',
          statusCode: 404,
        });
      });
    });
  });

  describe("verifyAuthorization", () => {
    it("denies unauthorized requests", async () => {
      const handler: APIGatewayProxyHandler = async (event) => {
        verifyAuthorization(event, "Test");
        return Promise.resolve(apiResponse());
      };
      const wrappedResponse = applyMiddlewares(handler)({
        headers: {
          Authorization: "Bearer Fail",
        },
      });
      await expect(wrappedResponse).resolves.toEqual({
        body: JSON.stringify({
          errors: [
            {
              detail: "The authorization token could not be validated.",
              status: "403",
              title: "NucleusError",
            },
          ],
        }),
        statusCode: 403,
      });
    });

    it("allows authorized requests", async () => {
      const handler: APIGatewayProxyHandler = async (event) => {
        verifyAuthorization(event, "Test");
        return Promise.resolve(apiResponse());
      };
      const wrappedResponse = applyMiddlewares(handler)(
        {
          headers: {
            Authorization: "Bearer Test",
          },
        },
        {} as any,
      );
      await expect(wrappedResponse).resolves.toEqual({
        body: "",
        statusCode: 200,
      });
    });
  });

  describe("getRoleName", () => {
    it("throws when there's no arn", () => {
      expect(() =>
        getRoleName({ requestContext: { identity: { userArn: null } } } as APIGatewayProxyEvent),
      ).toThrowError(NucleusError);
    });

    it("throws when it can't extract the role name", () => {
      expect(() =>
        getRoleName({
          requestContext: {
            identity: { userArn: "arn:aws:sts::123456:assumed-role//TestFunction" },
          },
        } as APIGatewayProxyEvent),
      ).toThrowError(NucleusError);
    });

    it("finds an internal role", () => {
      const roleName = getRoleName({
        requestContext: {
          identity: { userArn: "arn:aws:sts::123456:assumed-role/Internal/TestFunction" },
        },
      } as APIGatewayProxyEvent);
      expect(roleName.isExternal).toBeFalsy();
      expect(roleName.name).toEqual("Internal");
    });

    it("finds an external role", () => {
      const roleName = getRoleName({
        requestContext: {
          identity: {
            userArn: "arn:aws:sts::123456:assumed-role/nucleus_ex_test_test/TestFunction",
          },
        },
      } as APIGatewayProxyEvent);
      expect(roleName.isExternal).toBeTruthy();
      expect(roleName.name).toEqual("nucleus_ex_test_test");
    });
  });
});
