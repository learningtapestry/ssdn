/**
 * Polyfills Object.assign.
 *
 * Base code is from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
 *
 * @param target  The target object.
 * @param varArgs The source object(s).
 * @returns       The target object.
 */
export function objectAssign(target: object, ...varArgs: any[]) {
  if (!target) {
    // TypeError if undefined or null
    throw new TypeError("Cannot convert undefined or null to object");
  }

  const to = Object(target);

  for (let index = 1; index < arguments.length; index++) {
    const nextSource = arguments[index];

    if (nextSource != null) {
      // Skip over if undefined or null
      for (const nextKey in nextSource) {
        // Avoid bugs when hasOwnProperty is shadowed
        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
          to[nextKey] = nextSource[nextKey];
        }
      }
    }
  }

  return to;
}

if (typeof Object.assign !== "function") {
  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, "assign", {
    configurable: true,
    value: objectAssign,
    writable: true,
  });
}
