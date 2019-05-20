import { HeartbeatMessage } from "./heartbeatMessage";

describe("HearbeatMessage", () => {
  it("correctly exposes interface members", () => {
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

    expect(message.type).toEqual("heartbeat");

    expect(message.user).toEqual({
      extensions: { homePage: "https://www.test.com" },
      id: "test@example.com",
    });

    expect(message.data).toEqual({
      heartbeatId: "1234567890",
      pageTitle: "Khan Academy",
      pageUrl: "https://www.khanacademy.org",
      timeSpentOnPage: 10,
    });
  });
});
