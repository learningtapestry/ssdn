/**
 * app-helper.ts: General module containing utility functions
 */

import get from "lodash/fp/get";
import isArray from "lodash/fp/isArray";
import isEmpty from "lodash/fp/isEmpty";
import isNil from "lodash/fp/isNil";

export function isBlank(text?: string | null) {
    return isNil(text) || isEmpty(text);
}

export function decode64(content: string) {
    return Buffer.from(content, "base64").toString();
}

export function utcDate(timestamp: number) {
    return new Date(timestamp).toUTCString();
}

export function readEnv(name: string, defaultValue?: any) {
    const value = get(name)(process.env);
    if (isBlank(value) && !isNil(defaultValue)) {
        return defaultValue;
    } else if (isBlank(value)) {
        throw new Error(`Variable '${name}' has not been initialized`);
    } else {
        return value;
    }
}

export function toArray(content: object | object[]) {
    return isArray(content) ? content : [content];
}

export function wrap(object: object, root: string = "") {
    const wrappedObject: any = {};
    wrappedObject[root] = object;

    return isBlank(root) ? object : wrappedObject;
}
