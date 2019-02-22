/**
 * app-helper.ts: General module containing utility functions
 */

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
