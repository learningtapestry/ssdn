import { Client } from "./client";
import { Collector, HeartbeatCollector, VideoCollector } from "./collectors";
import { ImageBeaconClient } from "./imageBeaconClient";
import { XApiEncoder } from "./messages/xApiEncoder";
import { User } from "./user";

/**
 * Options for the static Nucleus builder method.
 */
export interface BuildNucleusOptions {
  /**
   * URL for the Nucleus server instance.
   * @example http://example.com
   */
  server: string;

  /**
   * API key for authenticating with Nucleus.
   */
  apiKey: string;

  /**
   * Convenience option for registering data collectors with the Nucleus agent.
   *
   * It is possible to simply specify the collector, by using a string, or if
   * necessary to pass in constructor arguments by using an array.
   *
   * At the moment, two collector shorthands are available: "heartbeat" (for
   * the HeartbeatCollector) and "video" (for the "VideoCollector").
   *
   * @example
   * {
   *   collectors: [
   *     "video",
   *     [
   *       "heartbeat",
   *       {
   *         "heartbeatInterval": 5000
   *       }
   *     ]
   *   ]
   * }
   */
  collectors: Array<string | any[]>;

  /**
   * The Nucleus message user.
   */
  user: User;
}

/**
 * The primary `nucleus-collection-agent` class. It provides a wrapper around
 * the various components used in the library, such as the Nucleus client and
 * the agent data collectors.
 */
export class Nucleus {
  /**
   * Convenience method for building a Nucleus instance. It takes care of
   * building agent components such as the client and the data collectors.
   * @param options Options for building a new Nucleus instance.
   */
  public static build(options: BuildNucleusOptions) {
    const client = new ImageBeaconClient(options.server, options.apiKey, new XApiEncoder());

    const collectors = [];

    for (const collector of options.collectors) {
      const collectorType: string =
        Object.prototype.toString.call(collector) === "[object Array]" ? collector[0] : collector;

      switch (collectorType) {
        case "video":
          collectors.push(new VideoCollector(client, options.user));
          break;
        case "heartbeat":
          collectors.push(new HeartbeatCollector(client, options.user, collector[1]));
          break;
        default:
          break;
      }
    }

    return new this(client, collectors, options.user);
  }

  /**
   * Client used for connecting with the Nucleus server.
   */
  public client: Client;

  /**
   * The user or actor, _in the context of a Nucleus message_.
   */
  public user: User;

  /**
   * Collectors registered for this agent instance.
   */
  public collectors: Collector[];

  /**
   * Constructs a new Nucleus instance. This is considered a low-level method;
   * we recommend using the static `.builder` method instead.
   *
   * @param client Client used for connecting with the Nucleus server.
   * @param collectors Collectors registered for this agent instance.
   * @param user The user or actor, _in the context of a Nucleus message_.
   */
  constructor(client: Client, collectors: Collector[], user: User) {
    this.client = client;
    this.collectors = collectors;
    this.user = user;
  }
}
