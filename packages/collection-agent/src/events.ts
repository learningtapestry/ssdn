import { contentLoaded } from "./polyfills/contentLoaded";

// tslint:disable-next-line: ban-types
const runAllExecutor = (fns: Function[]) => {
  return () => {
    for (const fn of fns) {
      fn();
    }
  };
};

/**
 * This constant is set to `true` if we're dealing with a relatively modern
 * browser (IE9+) or `false` otherwise.
 */
export const MODERN_BROWSER = !!window.addEventListener;

/**
 * Abstracts the `onDOMContentLoaded` event, for performing actions once the
 * browser DOM is loaded and available.
 * @param fn Event callback.
 * @returns A callable that deregisters the event handler.
 */
export function onDOMContentLoaded(fn: (e: Event) => void): () => void {
  contentLoaded(window, fn);

  return () => {
    removeListener(document, "DOMContentLoaded", fn);
  };
}

/**
 * Abstracts the occasion of a browser window being put back into visibility.
 * For example, if the user alt+tabs to another program and later returns to the
 * browser window, this event will be triggered.
 * It will also be triggered if the user switches back to the relevant tab after
 * having used another one.
 * @param fn Event callback.
 * @returns A callable that deregisters the event handler.
 */
export function onWindowVisible(fn: (e: Event) => void): () => void {
  const listeners: Array<() => void> = [];

  listeners.push(addListener(window, "focus", fn));

  if (!MODERN_BROWSER) {
    return runAllExecutor(listeners);
  }

  listeners.push(
    addListener(document, "visibilitychange", (e: Event) => {
      if (document.hidden) {
        return;
      }

      fn.call(document, e);
    }),
  );

  return runAllExecutor(listeners);
}

/**
 * Abstracts the occasion of a browser window fading from visibility (i.e. being
 * hidden).
 * For example, if the user alt+tabs to another program or switches to another
 * tab, this event will be triggered.
 * @param fn Event callback.
 * @returns A callable that deregisters the event handler.
 */
export function onWindowHidden(fn: (e: Event) => void): () => void {
  const listeners: Array<() => void> = [];

  listeners.push(
    addListener(window, "blur", (e) => {
      if (!document.hasFocus()) {
        fn.call(window, e);
      }
    }),
  );

  if (!MODERN_BROWSER) {
    return runAllExecutor(listeners);
  }

  listeners.push(
    addListener(document, "visibilitychange", (e: Event) => {
      if (document.hidden) {
        fn.call(document, e);
      }
    }),
  );

  return runAllExecutor(listeners);
}

/**
 * Attaches an event handler for a particular event. Abstracts browser
 * differences.
 * @param target    The object into which the event handler will be attached.
 * @param eventType The event type.
 * @param fn        The event handler.
 * @returns A callable that deregisters the event handler.
 */
export function addListener(
  target: Window | Document | HTMLElement,
  eventType: string,
  fn: (e: Event) => void,
): () => void {
  if (MODERN_BROWSER) {
    target.addEventListener(eventType, fn);
  } else {
    (target as any).attachEvent(`on${eventType}`, fn);
  }

  return () => {
    removeListener(target, eventType, fn);
  };
}

/**
 * Removes an attached event handler. Abstracts browser differences.
 * @param target    The object into which the event handler was attached.
 * @param eventType The event type.
 * @param fn        The event handler.
 */
export function removeListener(
  target: Window | Document | HTMLElement,
  eventType: string,
  fn: (e: Event) => void,
) {
  if (MODERN_BROWSER) {
    target.removeEventListener(eventType, fn);
  } else {
    (target as any).detachEvent(`on${eventType}`, fn);
  }
}
