import uuid from "lil-uuid";
import { Client } from "../client";
import { onDOMContentLoaded, onWindowHidden, onWindowVisible } from "../events";
import { HeartbeatMessage } from "../messages";
import { PageContext } from "../pageContext";
import { User } from "../user";
import { Collector } from "./collector";

/**
 * Custom configuration for the `HeartbeatCollector`.
 */
export interface HeartbeatCollectorConfiguration {
  /**
   * The interval frequency for heartbeats, in miliseconds.
   * A new heartbeat message is generated every `heartbeatInterval` miliseconds.
   */
  heartbeatInterval: number;
}

/**
 * A collector that tracks user permanence in a browser page. It periodically
 * generates "heartbeat" messages that are sent to the server. Each new message
 * stores the total time that the user has spent on the page.
 */
export class HeartbeatCollector implements Collector {
  /**
   * Unique identifier for the session. Allows the backend to aggregate hearbeat
   * messages.
   */
  public readonly heartbeatId: string = uuid();

  /**
   * The Nucleus agent client.
   */
  public client: Client;

  /**
   * The Nucleus message user.
   */
  public user: User;

  /**
   * Configuration for this `HeartbeatCollector` instance.
   */
  public readonly config: HeartbeatCollectorConfiguration;

  private intervalId: number = 0;

  private lastHeartbeatTime = Date.now();

  private timeSpentOnPage = 0;

  /**
   * Builds a new `HeartbeatCollector`.
   * @param client   The Nucleus agent client.
   * @param user     The Nucleus message user.
   * @param [config] Configuration for the heartbeat collector.
   */
  constructor(
    client: Client,
    user: User,
    config?: HeartbeatCollectorConfiguration,
  ) {
    this.client = client;
    this.user = user;
    this.config = Object.assign(
      {},
      {
        heartbeatInterval: 2000,
      },
      config || {},
    );

    onDOMContentLoaded((e) => {
      this.enableHeartbeat();
    });

    onWindowVisible((e) => {
      this.enableHeartbeat();
    });

    onWindowHidden((e) => {
      this.disableHeartbeat();
    });
  }

  private sendHeartbeat() {
    if (this.intervalId === 0) {
      // Heartbeat was disabled.
      return;
    }

    const newHeartbeatTime = Date.now();

    this.timeSpentOnPage += newHeartbeatTime - this.lastHeartbeatTime;
    this.lastHeartbeatTime = newHeartbeatTime;

    const page = new PageContext();

    this.client.sendMessage(
      new HeartbeatMessage(this.user, {
        heartbeatId: this.heartbeatId,
        pageTitle: page.pageTitle,
        pageUrl: page.url,
        timeSpentOnPage: Math.floor(this.timeSpentOnPage / 1000),
      }),
    );
  }

  private enableHeartbeat() {
    if (this.intervalId !== 0) {
      window.clearInterval(this.intervalId);
    }

    this.intervalId = window.setInterval(
      () => this.sendHeartbeat(),
      this.config.heartbeatInterval,
    );

    this.sendHeartbeat();
  }

  private disableHeartbeat() {
    window.clearInterval(this.intervalId);
    this.intervalId = 0;
  }
}
