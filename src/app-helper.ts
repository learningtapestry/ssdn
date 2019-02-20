/**
 * app-helper.ts: General module containing utility functions
 */

import isEmpty from "lodash/fp/isEmpty";
import isNil from "lodash/fp/isNil";

export function isBlank(text?: string | null) {
    return isNil(text) || isEmpty(text);
}
