import { Client } from "./client";
import { Message, MessageEncoder } from "./messages";

/**
 * Callback for image beacon client requests.
 * Since not much information about the network request is stored in the HTML
 * image after setting its `src`, the data provided in this variation of the
 * `ClientSendMessageCallback` is limited.
 *
 * @param [error]    `true`, if an error happened, or falsy if none occurred.
 * @param [response]  It is never set, since a response cannot be communicated via
 *                    an image beacon.
 * @param [request]   The HTML image element used to ping the Nucleus server.
 *                    Its `src` property will be set with an URL the encodes all
 *                    the message data.
 */
export type ImageBeaconCallback = (
  error?: true,
  response?: null,
  request?: HTMLImageElement,
) => void;

/**
 * `Client` implementation that uses an [image beacon](https://en.wikipedia.org/wiki/Web_beacon)
 * for sending messages to a Nucleus server.
 *
 * Image beacons are created by instantiating a new HTML image object in memory
 * and setting its `src` property with the URL for a Nucleus service and the
 * encoded message in the query string. Once such an object is initialised,
 * the browser immediately attempts to fetch the 'image' from the server.
 */
export class ImageBeaconClient implements Client {
  /**
   * The base URL for the Nucleus server instance.
   */
  public baseUrl: string;

  /**
   * The API key for connecting with the Nucleus server instance.
   */
  public apiKey: string;

  /**
   * The default namespace for events.
   */
  public defaultNamespace?: string;

  /**
   * The message encoder for encoding Nucleus messages into the desired format.
   */
  public encoder: MessageEncoder;

  /**
   * Creates an instance for the `ImageBeaconClient`.
   * @param baseUrl The base URL for the Nucleus server instance.
   * @param apiKey  The API key for connecting with the Nucleus server instance.
   * @param encoder The message encoder for encoding Nucleus messages into the
   *                desired format.
   */
  constructor(baseUrl: string, apiKey: string, encoder: MessageEncoder, defaultNamespace?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.defaultNamespace = defaultNamespace;
    this.encoder = encoder;
  }

  /**
   * Sends a message to a Nucleus server instance via an image beacon.
   * @param message    The message.
   * @param [callback] An optional callback for handling responses and errors for
   *                   the network request.
   */
  public sendMessage(
    message: Message,
    callback?: ImageBeaconCallback,
    namespace = this.defaultNamespace,
  ) {
    const encodedMessage = encodeURIComponent(JSON.stringify(this.encoder.encode(message)));
    const image = document.createElement("img");
    image.onload = (_) => {
      if (callback) {
        callback(undefined, undefined, image);
      }
    };
    image.onerror = (_) => {
      if (callback) {
        callback(true, undefined, image);
      }
    };
    image.src = this.buildUrl(encodedMessage, namespace);
  }

  private buildUrl(message: string, namespace?: string) {
    const pieces = [];

    if (namespace) {
      pieces.push(`ns=${namespace}`);
    }

    pieces.push(`aid=${this.apiKey}`, `event=${message}`);

    return `${this.baseUrl}/beacon?${pieces.join("&")}`;
  }
}
