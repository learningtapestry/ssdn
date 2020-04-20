import { User } from "../user";
import { Message } from "./message";

/**
 * Custom data used by heartbeat messages.
 */
export interface HeartbeatMessageData {
  /**
   * How long the user has spent on the page, in seconds.
   */
  timeSpentOnPage: number;
  /**
   * Unique ID for the current user session.
   */
  heartbeatId: string;
  /**
   * The URL for the current browser page.
   */
  pageUrl: string;
  /**
   * The HTML title for the current browser page.
   */
  pageTitle: string;
}

/**
 * Message implementation for a "heartbeat" message.
 * Heartbeats are used to keep track of user activity/permanence in a browser
 * page. If heartbeat messages are being sent, that means the user has the page
 * open and visible in the browser.
 * It is possible to aggregate heartbeats to have a clear picture of the user
 * session duration.
 */
export class HeartbeatMessage implements Message {
  public type = "heartbeat";

  public user: User;

  public data: HeartbeatMessageData;

  /**
   * Creates a heartbeat message.
   * @param user The `SSDN` message user (xAPI agent).
   * @param data Custom data for this message.
   */
  constructor(user: User, data: HeartbeatMessageData) {
    this.user = user;
    this.data = data;
  }
}
