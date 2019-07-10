import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";

import { SSDNError } from "../errors/ssdn-error";
import {
  apiResponse,
  applyMiddlewares,
  getLowercaseHeader,
  getRoleName,
  verifyAuthorization,
} from "./api-helper";

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

    describe("ssdn-error", () => {
      it("forwards non-ssdn errors", async () => {
        const handler = () => Promise.reject(new Error("Test"));
        const wrappedResponse = applyMiddlewares(handler)({});
        await expect(wrappedResponse).rejects.toBeTruthy();
      });

      it("transforms ssdn errors", async () => {
        const handler = () => Promise.reject(new SSDNError("NotFound", 404));
        const wrappedResponse = applyMiddlewares(handler)({});
        await expect(wrappedResponse).resolves.toBeTruthy();
        await expect(wrappedResponse).resolves.toEqual({
          body: '{"errors":[{"detail":"NotFound","status":"404","title":"SSDNError"}]}',
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
              title: "SSDNError",
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
      ).toThrowError(SSDNError);
    });

    it("throws when it can't extract the role name", () => {
      expect(() =>
        getRoleName({
          requestContext: {
            identity: { userArn: "arn:aws:sts::123456:assumed-role//TestFunction" },
          },
        } as APIGatewayProxyEvent),
      ).toThrowError(SSDNError);
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
            userArn: "arn:aws:sts::123456:assumed-role/ssdn_ex_test_test/TestFunction",
          },
        },
      } as APIGatewayProxyEvent);
      expect(roleName.isExternal).toBeTruthy();
      expect(roleName.name).toEqual("ssdn_ex_test_test");
    });
  });

  describe("getLowercaseHeader", () => {
    it("returns a function that finds headers no matter the case", () => {
      expect(getLowercaseHeader({ test: "success" })("test")).toEqual("success");
      expect(getLowercaseHeader({ TeSt: "success" })("test")).toEqual("success");
      expect(getLowercaseHeader({ TEST: "success" })("test")).toEqual("success");
    });
  });
});
