import { expect } from "chai";

import { baseUrl, getMessages, homePage } from "../specUtil";

const xApiBase = "https://xapi-learningtapestry.github.io/nucleus";

const extensions = {
  state: `${xApiBase}/extensions/played/state`,
  videoUrl: `${xApiBase}/extensions/played/videoUrl`,
};

describe("videoCollector.imageBeacon.xApi", () => {
  it("pushes video messages", async () => {
    browser.url(homePage("video-messages"));

    // Wait until the YT API is loaded.
    browser.waitUntil(
      () =>
        !!browser.execute(() => {
          const windowAny = window as any;
          return (
            windowAny.nucleus &&
            windowAny.nucleus.current &&
            windowAny.nucleus.current.collectors[1] &&
            windowAny.nucleus.current.collectors[1].players.length > 0 &&
            typeof windowAny.nucleus.current.collectors[1].players[0]
              .playVideo === "function"
          );
        }),
    );

    // Play and pause the video.
    const iframe = $("iframe");
    iframe.scrollIntoView();
    iframe.moveTo();
    iframe.click();

    browser.execute(() => {
      const player = (window as any).nucleus.current.collectors[1].players[0];
      player.playVideo();
    });

    browser.pause(4000);

    browser.execute(() => {
      const player = (window as any).nucleus.current.collectors[1].players[0];
      player.pauseVideo();
      window.setTimeout(() => {
        (window as any).videoPlaybackDone = true;
      }, 2000);
    });

    browser.waitUntil(
      () =>
        !!browser.execute(() => {
          return (window as any).videoPlaybackDone;
        }),
    );

    // Assertions.
    const messages = await getMessages(baseUrl("video-messages"));
    const videoMessages = messages.filter(
      (m) =>
        m.event.verb.id ===
        "https://xapi-learningtapestry.github.io/nucleus/verbs/played",
    );

    expect(videoMessages.length).to.equal(2);

    const firstMessage = videoMessages[0];

    // API key is set
    expect(firstMessage.apiKey).to.equal("API_KEY");

    // Actor is set
    expect(firstMessage.event.actor).to.deep.equal({
      account: {
        homePage: "https://example.com",
        name: "test@example.com",
      },
      objectType: "Agent",
    });

    // Object is set
    // tslint:disable-next-line: no-unused-expression
    expect(
      (firstMessage.event.object.id as string).startsWith(
        "https://www.youtube.com",
      ),
    ).to.be.true;

    // Verb is set
    expect(firstMessage.event.verb).to.deep.equal({
      id: "https://xapi-learningtapestry.github.io/nucleus/verbs/played",
    });

    // Extensions are set
    expect(firstMessage.event.context.extensions[extensions.videoUrl]).to.equal(
      "https://www.youtube.com/watch?v=I6xQtFsODIQ",
    );

    expect(firstMessage.event.context.extensions[extensions.state]).to.equal(
      "playing",
    );

    // A pause message should have arrived as well
    expect(
      videoMessages[1].event.context.extensions[extensions.state],
    ).to.equal("paused");
  });
});
