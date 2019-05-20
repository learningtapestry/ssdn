/**
 * app-helper.ts: General module containing utility functions
 */
import get from "lodash/fp/get";
import has from "lodash/fp/has";
import isArray from "lodash/fp/isArray";
import uuid from "uuid/v4";

export function decode64(content: string) {
  return Buffer.from(content, "base64").toString();
}

export function isoDate(timestamp?: number) {
  return (timestamp ? new Date(timestamp) : new Date()).toISOString();
}

export function readEnv(name: string, defaultValue?: any) {
  const value = get(name)(process.env);

  if (value) {
    return value;
  }

  if (arguments.length === 2) {
    return defaultValue;
  }

  throw new Error(`Variable '${name}' has not been initialized`);
}

export function calculateIdentifier(content: object) {
  return has("id")(content) ? get("id")(content) : uuid();
}

export function toArray(content: object | object[]) {
  return isArray(content) ? content : [content];
}

export function wrap(object: object, root: string = "") {
  return root ? { [root]: object } : object;
}
