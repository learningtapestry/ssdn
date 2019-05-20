import { Message } from "./message";

/**
 * A `MessageEncoder` provides tools for encoding a `Message` into a particular
 * representation format, such as an xAPI statement.
 */
export interface MessageEncoder {
  /**
   * Encodes a message into a JavaScript object in the encoder's format.
   */
  encode: (message: Message) => object;
}
