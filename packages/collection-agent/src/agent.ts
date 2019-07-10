import "./polyfills/objectAssign";

import { BuildSSDNOptions, SSDN } from "./ssdn";

/**
 * This file is the entry point for the browser collection agent.
 *
 * It sets up a namespace inside the browser window that exposes public
 * components for the
 * library.
 *
 * If initialisation arguments have been provided with the `ssdn.configure`
 * method, the entry point will automatically build a `SSDN` collection agent
 * instance.
 */

declare global {
  interface Window {
    /**
     * The `ssdn-collection-agent` browser namespace.
     */
    ssdn: SSDNNamespace;
  }
}

/**
 * The `ssdn-collection-agent` browser namespace.
 */
interface SSDNNamespace {
  /**
   * If a previous object was registered under `window.ssdn`, we store it
   * here.
   */
  _previousSSDN?: SSDNNamespace;
  /**
   * Initialisation arguments for building a new `SSDN` instance when the
   * page loads.
   */
  args: unknown[][];
  /**
   * The current `SSDN` instance, if one was created by `bootstrap`.
   */
  current?: SSDN;
  /**
   * The `SSDN` class.
   * This is the primary `ssdn-collection-agent` class. It provides a wrapper
   * around the various components used in the library, such as the SSDN
   * client and the agent data collectors.
   */
  SSDN: typeof SSDN;
  /**
   * Collects configuration options for initialising a `SSDN` instance with
   * the `SSDN` method.
   *
   * This is a simple method that allows free-form options. It gives library
   * developers flexibility to add additional options in the future, and is
   * small enough to appear in the library bootstrap snippet.
   *
   * At the moment, options are passed as-is to the `SSDN` instance static
   * builder method.
   *
   * Currently the following options are required:
   *  - server: URL for the SSDN server instance.
   *  - apiKey: API key for authenticating with SSDN.
   *  - collectors: Data collectors to be registered (see the `SSDN` static builder).
   *  - user: The SSDN message user.
   */
  configure: (optionName: string, ...args: any[]) => void;
  /**
   * Builds a new `SSDN` instance. It will use the options previously
   * provided by `configure`.
   * Usually this method will run automatically once the page loads, but it may
   * be invoked manually.
   */
  bootstrap: () => SSDN;
}

/**
 * Builds a hash from an array of `SSDN.build` configuration options.
 * @param args An array of `SSDN.build` options.
 */
const buildOptions = (args: unknown[][]) => {
  const options: any = {};

  for (const arg of args) {
    options[arg[0] as string] = arg[1];
  }

  const requiredOptions = ["server", "apiKey", "collectors", "user"];
  const errors = [];

  for (const requiredOption of requiredOptions) {
    if (requiredOption in options) {
      continue;
    }
    errors.push(`The ${requiredOption} configuration is required.`);
  }

  if (errors.length > 0) {
    throw new Error(
      `SSDN options are invalid. Please review the following problems: ${errors.join(",")}`,
    );
  }

  return options as BuildSSDNOptions;
};

// Assign the `window.ssdn` namespace, respecting the user-provided bootstrap
// configuration and preserving old values if any existed.
const ssdn: SSDNNamespace = (window.ssdn = {
  SSDN,
  _previousSSDN: window.ssdn,
  args: window.ssdn ? window.ssdn.args || [] : [],
  configure(...args: any[]) {
    (this.args = this.args || []).push(args);
  },
  bootstrap(options?: BuildSSDNOptions) {
    options = options || buildOptions(this.args);
    this.current = SSDN.build(options);
    return this.current;
  },
});

// If any initialisation args have been provided by the user, build a new
// `SSDN` instance.
if (ssdn.args.length) {
  ssdn.bootstrap();
}
