import { HeartbeatMessage } from "./heartbeatMessage";
import { Message } from "./message";
import { MessageEncoder } from "./messageEncoder";
import { VideoMessage } from "./videoMessage";
import { XApiContext, XApiMessage, XApiVerb } from "./xApiSpec";

const xApiRepo = "https://xapi-learningtapestry.github.io/nucleus";

const xApiVerbs: { [verb: string]: XApiVerb } = {
  heartbeat: {
    id: `${xApiRepo}/verbs/heartbeat`,
  },
  played: {
    id: `${xApiRepo}/verbs/played`,
  },
};

/**
 * `MessageEncoder` that is able to convert a `Message` into an xAPI-compatible
 * representation.
 */
export class XApiEncoder implements MessageEncoder {
  /**
   * Encodes a generic `Message` into an xAPI statement.
   * @param message The message.
   * @returns An object representing an xAPI statement.
   */
  public encode(message: Message): XApiMessage {
    let objectId = "";

    if (message.type === "played") {
      objectId = (message as VideoMessage).data.videoUrl;
    } else if (message.type === "heartbeat") {
      objectId = (message as HeartbeatMessage).data.pageUrl;
    }

    let account;

    if (message.user) {
      account = {
        name: message.user.id,
        ...message.user.extensions,
      };
    }

    const context: XApiContext = { extensions: {} };

    for (const key in message.data) {
      if (message.data.hasOwnProperty(key)) {
        context.extensions[`${xApiRepo}/extensions/${message.type}/${key}`] =
          message.data[key];
      }
    }

    return {
      actor: {
        account,
        objectType: "Agent",
      },
      context,
      object: {
        id: objectId,

        objectType: "Activity",
      },
      verb: xApiVerbs[message.type],
    };
  }
}
