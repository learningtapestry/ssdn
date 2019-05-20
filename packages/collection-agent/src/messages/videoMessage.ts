import { User } from "../user";
import { Message } from "./message";

/**
 * Custom data used by video messages.
 */
export interface VideoMessageData {
  /**
   * The current video state.
   *
   * For YouTube: "cued", "buffering", "paused", "playing", "ended",
   * "unstarted", "uncertain".
   */
  state: string;

  /**
   * The URL for the video the user is interacting with.
   */
  videoUrl: string;
}

export class VideoMessage implements Message {
  public type = "played";

  public user: User;

  public data: VideoMessageData;

  /**
   * Creates a video message.
   * @param user The `Nucleus` message user (xAPI agent).
   * @param data Custom data for this message.
   */
  constructor(user: User, data: VideoMessageData) {
    this.user = user;
    this.data = data;
  }
}
