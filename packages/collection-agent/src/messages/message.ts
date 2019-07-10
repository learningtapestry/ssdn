import { User } from "../user";

/**
 * A SSDN message. It's a generic object that can be used to store any type
 * of information pertaining to an event, in context of an user.
 * In an xAPI context, for example, it is converted to a statement.
 */
export interface Message {
  /**
   * The message type.
   * @example "heartbeat"
   */
  type: string;
  /**
   * The `SSDN` message user (xAPI agent).
   */
  user?: User;
  /**
   * Custom data for this message.
   */
  data?: {
    [key: string]: any;
  };
}
