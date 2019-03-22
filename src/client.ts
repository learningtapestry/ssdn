import { Message, MessageEncoder } from "./messages";

/**
 * An optional callback for handling responses and errors for the network
 * request.
 *
 * @param [error]    A truthy object, if an error happened, or a falsy object if
 *                   none occurred.
 * @param [response] An object representing the response from the Nucleus server.
 * @param [request]  An object representing the original request performed by the
 *                   client.
 */
export type ClientSendMessageCallback = (error?: any, response?: any, request?: any) => void;

/**
 * A network client for sending messages to a Nucleus server instance.
 */
export interface Client {
  /**
   * The base URL for the Nucleus server instance.
   * @example https://example.com
   */
  baseUrl: string;
  /**
   * The API key for connecting with the Nucleus server instance.
   * @example 5a96c142-7abc-4611-b38e-e37ee4169ef9
   */
  apiKey: string;
  /**
   * The message encoder for encoding Nucleus messages into the desired format.
   */
  encoder: MessageEncoder;
  /**
   * Sends a message to the Nucleus server.
   *
   * @param message    The message.
   * @param [callback] An optional callback for handling responses and errors for
   *                   the network request.
   */
  sendMessage: (message: Message, callback?: ClientSendMessageCallback) => void;
}
