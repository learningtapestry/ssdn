import uuid from "lil-uuid";

import { baseUrl, getMessages, homePage } from "../specUtil";

const xApiBase = "https://learningtapestry.github.io/xapi/nucleus/collection";

const extensions = {
  heartbeatId: `${xApiBase}/extensions/heartbeatId`,
  pageTitle: `${xApiBase}/extensions/pageTitle`,
  pageUrl: `${xApiBase}/extensions/pageUrl`,
  timeSpentOnPage: `${xApiBase}/extensions/timeSpentOnPage`,
};

describe("heartbeatCollector.imageBeacon.xApi", () => {
  it("pushes heartbeat messages", async () => {
    browser.url(homePage("heartbeat-messages"));

    // Wait until we have collected a couple of visit messages.
    browser.pause(3000);

    // Verify expectations for the first message.
    const messages = await getMessages(baseUrl("heartbeat-messages"));

    const firstMessage = messages[0];

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
    expect(
      (firstMessage.event.object.id as string).startsWith("http://localhost:3000/"),
    ).toBeTruthy();

    // Verb is set
    expect(firstMessage.event.verb).toEqual({
      id: "https://learningtapestry.github.io/xapi/nucleus/collection/verbs/heartbeat",
    });

    // Extensions are set
    expect(firstMessage.event.context.extensions[extensions.pageTitle]).toEqual("Document");

    const heartbeatId = firstMessage.event.context.extensions[extensions.heartbeatId];
    // tslint:disable-next-line: no-unused-expression
    expect(uuid.isUUID(heartbeatId, "4")).toBeTruthy();

    expect(firstMessage.event.context.extensions[extensions.timeSpentOnPage]).toBeGreaterThan(-1);

    // There should be some messages with identical heartbeatId
    const sameHearts = messages.filter(
      (message) =>
        message.event.context.extensions[extensions.heartbeatId] ===
        firstMessage.event.context.extensions[extensions.heartbeatId],
    );

    expect(sameHearts.length).toBeGreaterThan(1);

    // It should have a longer "timeSpentOnPage" than the first
    const lastHeart = sameHearts.slice(-1)[0];

    expect(lastHeart.event.context.extensions[extensions.timeSpentOnPage]).toBeGreaterThan(
      firstMessage.event.context.extensions[extensions.timeSpentOnPage],
    );
  });
});
