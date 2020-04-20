import { Client } from "./client";
import { Collector, HeartbeatCollector, VideoCollector } from "./collectors";
import { ImageBeaconClient } from "./imageBeaconClient";
import { XApiEncoder } from "./messages/xApiEncoder";
import { User } from "./user";

/**
 * Options for the static SSDN builder method.
 */
export interface BuildSSDNOptions {
  /**
   * URL for the SSDN server instance.
   * @example http://example.com
   */
  server: string;

  /**
   * API key for authenticating with SSDN.
   */
  apiKey: string;

  /**
   * Convenience option for registering data collectors with the SSDN agent.
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
   * The SSDN message user.
   */
  user: User;

  /**
   * The namespace sent along with events.
   */
  defaultNamespace?: string;
}

/**
 * The primary `ssdn-collection-agent` class. It provides a wrapper around
 * the various components used in the library, such as the SSDN client and
 * the agent data collectors.
 */
export class SSDN {
  /**
   * Convenience method for building a SSDN instance. It takes care of
   * building agent components such as the client and the data collectors.
   * @param options Options for building a new SSDN instance.
   */
  public static build(options: BuildSSDNOptions) {
    const client = new ImageBeaconClient(
      options.server,
      options.apiKey,
      new XApiEncoder(),
      options.defaultNamespace,
    );

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
   * Client used for connecting with the SSDN server.
   */
  public client: Client;

  /**
   * The user or actor, _in the context of a SSDN message_.
   */
  public user: User;

  /**
   * Collectors registered for this agent instance.
   */
  public collectors: Collector[];

  /**
   * Constructs a new SSDN instance. This is considered a low-level method;
   * we recommend using the static `.builder` method instead.
   *
   * @param client Client used for connecting with the SSDN server.
   * @param collectors Collectors registered for this agent instance.
   * @param user The user or actor, _in the context of a SSDN message_.
   */
  constructor(client: Client, collectors: Collector[], user: User) {
    this.client = client;
    this.collectors = collectors;
    this.user = user;
  }
}
