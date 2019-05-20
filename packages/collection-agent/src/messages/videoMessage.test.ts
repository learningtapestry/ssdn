import { VideoMessage } from "./videoMessage";

describe("VideoMessage", () => {
  it("correctly exposes interface members", () => {
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

    expect(message.type).toEqual("played");

    expect(message.user).toEqual({
      extensions: { homePage: "https://www.test.com" },
      id: "test@example.com",
    });

    expect(message.data).toEqual({
      state: "playing",
      videoUrl: "https://www.youtube.com/watch?v=I6xQtFsODIQ",
    });
  });
});
