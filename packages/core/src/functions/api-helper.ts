import { APIGatewayProxyEvent, APIGatewayProxyResult, Context, Handler } from "aws-lambda";

import middy from "@middy/core";
import cors from "@middy/http-cors";

import { NucleusError } from "../errors/nucleus-error";

const errorMiddleware: middy.IMiddyMiddlewareObject = {
  onError: (h, next) => {
    if (h.error instanceof NucleusError) {
      // as per JSON spec http://jsonapi.org/examples/#error-objects-basics
      (h as any).response = {
        ...h.response,
        body: JSON.stringify({
          errors: [
            {
              detail: h.error.message,
              status: h.error.statusCode,
              title: h.error.name,
            },
          ],
        }),
        statusCode: h.error.statusCode ? parseInt(h.error.statusCode, 10) : 500,
      };
      return next();
    }

    return next(h.error);
  },
};

export type AsyncHandler<TEvent = any, TResult = any> = (
  event: TEvent,
  context?: Context,
) => Promise<TResult>;

export function applyMiddlewares<T extends Handler>(fn: T) {
  const handler = middy(fn)
    .use(errorMiddleware)
    .use(cors());
  return (handler as unknown) as AsyncHandler;
}

export function verifyAuthorization(event: APIGatewayProxyEvent, value: string) {
  const token = event.headers.Authorization.replace("Bearer ", "").trim();
  if (token === value) {
    return;
  }
  throw new NucleusError("The authorization token could not be validated.", 403);
}

export function apiResponse(content: any = "", statusCode: number = 200): APIGatewayProxyResult {
  if (typeof content !== "string") {
    content = JSON.stringify(content);
  }
  return {
    body: content,
    statusCode,
  };
}
