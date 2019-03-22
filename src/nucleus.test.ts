import { HeartbeatCollector, VideoCollector } from "./collectors";
import { XApiEncoder } from "./messages/xApiEncoder";
import { Nucleus } from "./nucleus";

describe("Nucleus", () => {
  describe("build", () => {
    it("builds a Nucleus instance", () => {
      const nucleus = Nucleus.build({
        apiKey: "test_key",
        collectors: [["heartbeat", { heartbeatInterval: 5000 }], "video"],
        server: "https://nucleus.test",
        user: {
          id: "test@example.com",
        },
      });

      expect(nucleus.client.apiKey).toEqual("test_key");
      expect(nucleus.client.baseUrl).toEqual("https://nucleus.test");
      expect(nucleus.client.encoder).toBeInstanceOf(XApiEncoder);
      expect(nucleus.collectors).toHaveLength(2);
      expect(nucleus.collectors[0]).toBeInstanceOf(HeartbeatCollector);
      expect(nucleus.collectors[1]).toBeInstanceOf(VideoCollector);
      expect(
        (nucleus.collectors[0] as HeartbeatCollector).config.heartbeatInterval,
      ).toEqual(5000);
    });
  });
});
