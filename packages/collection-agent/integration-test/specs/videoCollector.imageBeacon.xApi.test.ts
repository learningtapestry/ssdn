import { baseUrl, getMessages, homePage } from "../specUtil";

describe("videoCollector.imageBeacon.xApi", () => {
  it("pushes video messages", async () => {
    browser.url(homePage("video-messages"));

    // Wait until the YT API is loaded.
    browser.waitUntil(
      () =>
        !!browser.execute(() => {
          const windowAny = window as any;
          return (
            windowAny.ssdn &&
            windowAny.ssdn.current &&
            windowAny.ssdn.current.collectors[1] &&
            windowAny.ssdn.current.collectors[1].players.length > 0 &&
            typeof windowAny.ssdn.current.collectors[1].players[0].playVideo === "function"
          );
        }),
    );

    // Play and pause the video.
    const iframe = $("iframe");
    iframe.scrollIntoView();
    iframe.moveTo();
    iframe.click();

    browser.execute(() => {
      const player = (window as any).ssdn.current.collectors[1].players[0];
      player.playVideo();
    });

    browser.pause(4000);

    browser.execute(() => {
      const player = (window as any).ssdn.current.collectors[1].players[0];
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
    const videoMessages = messages.filter((m) =>
      m.event.verb.id.startsWith("https://w3id.org/xapi/video"),
    );

    expect(videoMessages.length).toEqual(2);

    const firstMessage = videoMessages[0];

    // API key is set
    expect(firstMessage.aid).toEqual("API_KEY");

    // Actor is set
    expect(firstMessage.event.actor).toEqual({
      account: {
        homePage: "https://example.com",
        name: "test@example.com",
      },
      objectType: "Agent",
    });

    // Object is set
    // tslint:disable-next-line: no-unused-expression
    expect(firstMessage.event.object.id as string).toEqual(
      "https://www.youtube.com/watch?v=I6xQtFsODIQ",
    );

    // Verb is set
    expect(firstMessage.event.verb).toEqual({
      id: "https://w3id.org/xapi/video/verbs/played",
    });
  });
});
