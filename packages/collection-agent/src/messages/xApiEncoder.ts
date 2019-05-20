import { HeartbeatMessage } from "./heartbeatMessage";
import { Message } from "./message";
import { MessageEncoder } from "./messageEncoder";
import { VideoMessage } from "./videoMessage";
import { XApiActor, XApiContext, XApiMessage, XApiObject, XApiVerb } from "./xApiSpec";

const heartbeatVerb = "https://learningtapestry.github.io/xapi/nucleus/collection/verbs/heartbeat";
const heartbeatExtensions: { [k: string]: string } = {
  heartbeatId: "https://learningtapestry.github.io/xapi/nucleus/collection/extensions/heartbeatId",
  pageTitle: "https://learningtapestry.github.io/xapi/nucleus/collection/extensions/pageTitle",
  timeSpentOnPage:
    "https://learningtapestry.github.io/xapi/nucleus/collection/extensions/timeSpentOnPage",
};

const videoVerbs: { [k: string]: string } = {
  ended: "http://adlnet.gov/expapi/verbs/completed",
  paused: "https://w3id.org/xapi/video/verbs/paused",
  playing: "https://w3id.org/xapi/video/verbs/played",
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
    if (message.type === "video") {
      return this.parseVideoMessage(message as VideoMessage);
    } else if (message.type === "heartbeat") {
      return this.parseHeartbeatMessage(message as HeartbeatMessage);
    }
    throw new Error("Unknown messsage type.");
  }

  private parseHeartbeatMessage(message: HeartbeatMessage) {
    const actor: XApiActor = {
      account: {
        name: message.user.id,
        ...message.user.extensions,
      },
      objectType: "Agent",
    };
    const verb: XApiVerb = {
      id: heartbeatVerb,
    };
    const object: XApiObject = {
      definition: {
        type: "https://learningtapestry.github.io/xapi/nucleus/collection/activities/page",
      },
      id: message.data.pageUrl,
      objectType: "Activity",
    };
    const context: XApiContext = {
      extensions: {},
    };
    if (message.data) {
      for (const [k, v] of Object.entries(message.data)) {
        if (heartbeatExtensions[k]) {
          context.extensions[heartbeatExtensions[k]] = v;
        }
      }
    }
    return {
      actor,
      context,
      object,
      verb,
    };
  }

  private parseVideoMessage(message: VideoMessage) {
    const actor: XApiActor = {
      account: {
        name: message.user.id,
        ...message.user.extensions,
      },
      objectType: "Agent",
    };
    const verb: XApiVerb = {
      id: videoVerbs[message.data.state],
    };
    const object: XApiObject = {
      definition: {
        type: "https://w3id.org/xapi/video/activity-type/video",
      },
      id: message.data.videoUrl,
      objectType: "Activity",
    };
    return {
      actor,
      object,
      verb,
    };
  }
}
