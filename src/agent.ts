import "./polyfills/objectAssign";

import { BuildNucleusOptions, Nucleus } from "./nucleus";

/**
 * This file is the entry point for the browser collection agent.
 *
 * It sets up a namespace inside the browser window that exposes public
 * components for the
 * library.
 *
 * If initialisation arguments have been provided with the `nucleus.configure`
 * method, the entry point will automatically build a `Nucleus` collection agent
 * instance.
 */

declare global {
  interface Window {
    /**
     * The `nucleus-collection-agent` browser namespace.
     */
    nucleus: NucleusNamespace;
  }
}

/**
 * The `nucleus-collection-agent` browser namespace.
 */
interface NucleusNamespace {
  /**
   * If a previous object was registered under `window.nucleus`, we store it
   * here.
   */
  _previousNucleus?: NucleusNamespace;
  /**
   * Initialisation arguments for building a new `Nucleus` instance when the
   * page loads.
   */
  args: unknown[][];
  /**
   * The current `Nucleus` instance, if one was created by `bootstrap`.
   */
  current?: Nucleus;
  /**
   * The `Nucleus` class.
   * This is the primary `nucleus-collection-agent` class. It provides a wrapper
   * around the various components used in the library, such as the Nucleus
   * client and the agent data collectors.
   */
  Nucleus: typeof Nucleus;
  /**
   * Collects configuration options for initialising a `Nucleus` instance with
   * the `Nucleus` method.
   *
   * This is a simple method that allows free-form options. It gives library
   * developers flexibility to add additional options in the future, and is
   * small enough to appear in the library bootstrap snippet.
   *
   * At the moment, options are passed as-is to the `Nucleus` instance static
   * builder method.
   *
   * Currently the following options are required:
   *  - server: URL for the Nucleus server instance.
   *  - apiKey: API key for authenticating with Nucleus.
   *  - collectors: Data collectors to be registered (see the `Nucleus` static builder).
   *  - user: The Nucleus message user.
   */
  configure: (optionName: string, ...args: any[]) => void;
  /**
   * Builds a new `Nucleus` instance. It will use the options previously
   * provided by `configure`.
   * Usually this method will run automatically once the page loads, but it may
   * be invoked manually.
   */
  bootstrap: () => Nucleus;
}

/**
 * Builds a hash from an array of `Nucleus.build` configuration options.
 * @param args An array of `Nucleus.build` options.
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
      `Nucleus options are invalid. Please review the following problems: ${errors.join(
        ",",
      )}`,
    );
  }

  return options as BuildNucleusOptions;
};

// Assign the `window.nucleus` namespace, respecting the user-provided bootstrap
// configuration and preserving old values if any existed.
const nucleus: NucleusNamespace = (window.nucleus = {
  Nucleus,
  _previousNucleus: window.nucleus,
  args: window.nucleus ? window.nucleus.args || [] : [],
  configure(...args: any[]) {
    (this.args = this.args || []).push(args);
  },
  bootstrap(options?: BuildNucleusOptions) {
    options = options || buildOptions(this.args);
    this.current = Nucleus.build(options);
    return this.current;
  },
});

// If any initialisation args have been provided by the user, build a new
// `Nucleus` instance.
if (nucleus.args.length) {
  nucleus.bootstrap();
}
