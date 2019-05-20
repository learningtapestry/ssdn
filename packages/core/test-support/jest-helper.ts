import { APIGatewayProxyEvent } from "aws-lambda";
import { Service } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { Factory } from "../src/interfaces/base-types";

type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never
}[keyof T];
type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;

// Convenience type for constructing fake implementations.
// Allows the type checker to hint on method names.
export type FakeImpl<T extends FunctionProperties<T>> = { [K in keyof T]?: jest.Mock<any, any> };

// Convenience method for type-hinting a fake implementation.
export function fakeImpl<T>(subject: FakeImpl<T>) {
  return (subject as unknown) as T;
}

// Convenience method for type-hinting a jest mock.
export function mocked(subject: any) {
  return (subject as unknown) as jest.Mock<any>;
}

// Convenience method that takes in a partial implementation and returns a factory
// function that is type-hinted with the full type.
export function fakeFactory<T>(subject: FakeImpl<T>) {
  return ((() => subject) as unknown) as Factory<T>;
}

// Wraps the methods of an object with a function that returns a `{ promise: () => Promise }`
// object, mimicking the AWS service interface.
// The inner promise method forwards calls to the original implementation.
// The original implementation is preserved in object.impl.
export function fakeAws<T extends Service | DocumentClient>(subject: FakeImpl<T>) {
  const wrappedSubject: { [k: string]: any } = {};
  for (const [methodName, methodDef] of Object.entries(subject)) {
    wrappedSubject[methodName] = jest.fn((params: any) => ({
      promise: () => methodDef!(params),
    }));
    (wrappedSubject[methodName] as any).impl = methodDef;
  }
  wrappedSubject.impl = subject;
  return (wrappedSubject as unknown) as T & { impl: typeof subject };
}

class EventBuilder {
  private event: Partial<APIGatewayProxyEvent>;
  constructor(init: Partial<APIGatewayProxyEvent> = {}) {
    this.event = init;
  }
  public headers(attrs: { [name: string]: string }) {
    this.event = { ...this.event, headers: attrs };
    return this;
  }
  public queryString(attrs: { [name: string]: string }) {
    this.event = { ...this.event, queryStringParameters: attrs };
    return this;
  }
  public path(attrs: { [name: string]: string }) {
    this.event = { ...this.event, pathParameters: attrs };
    return this;
  }
  public body(payload: object) {
    this.event.body = typeof payload !== "string" ? JSON.stringify(payload) : payload;
    return this;
  }
  public requestContext(attrs: any) {
    this.event = { ...this.event, requestContext: { ...attrs } as any };
    return this;
  }
  public build() {
    return this.event;
  }
}

export function buildApiProxyHandlerEvent() {
  return new EventBuilder();
}
