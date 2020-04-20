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
            "https://learningtapestry.github.io/xapi/ssdn/collection/extensions/heartbeatId":
              "1234567890",
            "https://learningtapestry.github.io/xapi/ssdn/collection/extensions/pageTitle":
              "Khan Academy",
            "https://learningtapestry.github.io/xapi/ssdn/collection/extensions/timeSpentOnPage": 10,
          },
        },
        object: {
          definition: {
            type: "https://learningtapestry.github.io/xapi/ssdn/collection/activities/page",
          },
          id: "https://www.khanacademy.org",
          objectType: "Activity",
        },
        verb: {
          id: "https://learningtapestry.github.io/xapi/ssdn/collection/verbs/heartbeat",
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
        object: {
          definition: {
            type: "https://w3id.org/xapi/video/activity-type/video",
          },
          id: "https://www.youtube.com/watch?v=I6xQtFsODIQ",
          objectType: "Activity",
        },
        verb: {
          id: "https://w3id.org/xapi/video/verbs/played",
        },
      });
    });
  });
});
