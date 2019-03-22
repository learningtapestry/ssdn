import { parse as parseQueryString } from "querystring";
import { parse as parseUrl } from "url";

import { ImageBeaconClient } from "./imageBeaconClient";
import { VideoMessage, XApiEncoder } from "./messages";
import { temporaryGlobalVariable } from "./testSetup";

const buildMessage = () =>
  new VideoMessage(
    {
      extensions: { homePage: "https://www.test.com" },
      id: "test@example.com",
    },
    {
      state: "playing",
      videoUrl: "https://www.youtube.com/watch?v=I6xQtFsODIQ",
    },
  );

describe("ImageBeaconClient", () => {
  describe("sendMessage", () => {
    it("constructs an URL that has all the necessary information", (done) => {
      const client = new ImageBeaconClient("https://backend.test", "test_key", new XApiEncoder());

      const message = buildMessage();

      client.sendMessage(message, (error, response, image) => {
        const url = parseUrl(image!.src);
        const qs = parseQueryString(url.query as string);

        expect(url.host).toEqual("backend.test");
        expect(qs.apiKey).toEqual("test_key");

        const encodedMessage = new XApiEncoder().encode(message);
        const decodedEvent = JSON.parse(qs.event as string);
        expect(decodedEvent).toEqual(encodedMessage);

        done();
      });
    });

    it("invokes the callback with an error when the image fails to load", (done) => {
      const client = new ImageBeaconClient("https://backend.test", "test_key", new XApiEncoder());

      client.sendMessage(buildMessage(), (error) => {
        expect(error).toBeTruthy();
        done();
      });
    });

    it("invokes the callback with NO error when the image loads", (done) => {
      const client = new ImageBeaconClient("https://backend.test", "test_key", new XApiEncoder());

      temporaryGlobalVariable("imagesShouldLoad", true, () => {
        client.sendMessage(buildMessage(), (error) => {
          expect(error).toBeFalsy();
          done();
        });
      });
    });
  });
});
