import { HeartbeatMessage } from "./heartbeatMessage";
import { VideoMessage } from "./videoMessage";
import { XApiEncoder } from "./xApiEncoder";

describe("XApiEncoder", () => {
  describe("encode", () => {
    it("encodes a hearbeat message", () => {
      const message = new HeartbeatMessage(
        {
          extensions: { homePage: "https://www.test.com" },
          id: "test@example.com",
        },
        {
          heartbeatId: "1234567890",
          pageTitle: "Khan Academy",
          pageUrl: "https://www.khanacademy.org",
          timeSpentOnPage: 10,
        },
      );

      const encodedMessage = new XApiEncoder().encode(message);
      expect(encodedMessage).toEqual({
        actor: {
          account: {
            homePage: "https://www.test.com",
            name: "test@example.com",
          },
          objectType: "Agent",
        },
        context: {
          extensions: {
            "https://xapi-learningtapestry.github.io/nucleus/extensions/heartbeat/heartbeatId":
              "1234567890",
            "https://xapi-learningtapestry.github.io/nucleus/extensions/heartbeat/pageTitle":
              "Khan Academy",
            "https://xapi-learningtapestry.github.io/nucleus/extensions/heartbeat/pageUrl":
              "https://www.khanacademy.org",
            "https://xapi-learningtapestry.github.io/nucleus/extensions/heartbeat/timeSpentOnPage": 10,
          },
        },
        object: {
          id: "https://www.khanacademy.org",
          objectType: "Activity",
        },
        verb: {
          id: "https://xapi-learningtapestry.github.io/nucleus/verbs/heartbeat",
        },
      });
    });

    it("encodes a video message", () => {
      const message = new VideoMessage(
        {
          extensions: { homePage: "https://www.test.com" },
          id: "test@example.com",
        },
        {
          state: "playing",
          videoUrl: "https://www.youtube.com/watch?v=I6xQtFsODIQ",
        },
      );

      const encodedMessage = new XApiEncoder().encode(message);
      expect(encodedMessage).toEqual({
        actor: {
          account: {
            homePage: "https://www.test.com",
            name: "test@example.com",
          },
          objectType: "Agent",
        },
        context: {
          extensions: {
            "https://xapi-learningtapestry.github.io/nucleus/extensions/played/state": "playing",
            "https://xapi-learningtapestry.github.io/nucleus/extensions/played/videoUrl":
              "https://www.youtube.com/watch?v=I6xQtFsODIQ",
          },
        },
        object: {
          id: "https://www.youtube.com/watch?v=I6xQtFsODIQ",
          objectType: "Activity",
        },
        verb: {
          id: "https://xapi-learningtapestry.github.io/nucleus/verbs/played",
        },
      });
    });
  });
});
