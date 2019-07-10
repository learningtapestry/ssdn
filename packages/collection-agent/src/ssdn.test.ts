import { HeartbeatCollector, VideoCollector } from "./collectors";
import { XApiEncoder } from "./messages/xApiEncoder";
import { SSDN } from "./ssdn";

describe("SSDN", () => {
  describe("build", () => {
    it("builds a SSDN instance", () => {
      const ssdn = SSDN.build({
        apiKey: "test_key",
        collectors: [["heartbeat", { heartbeatInterval: 5000 }], "video"],
        server: "https://ssdn.test",
        user: {
          id: "test@example.com",
        },
      });

      expect(ssdn.client.apiKey).toEqual("test_key");
      expect(ssdn.client.baseUrl).toEqual("https://ssdn.test");
      expect(ssdn.client.encoder).toBeInstanceOf(XApiEncoder);
      expect(ssdn.collectors).toHaveLength(2);
      expect(ssdn.collectors[0]).toBeInstanceOf(HeartbeatCollector);
      expect(ssdn.collectors[1]).toBeInstanceOf(VideoCollector);
      expect((ssdn.collectors[0] as HeartbeatCollector).config.heartbeatInterval).toEqual(5000);
    });
  });
});
