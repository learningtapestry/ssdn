import "./agent";
import { SSDN } from "./ssdn";

describe("agent", () => {
  it("sets up a global namespace", () => {
    expect(window.ssdn).not.toBeUndefined();
    expect(window.ssdn.configure).not.toBeUndefined();
    expect(window.ssdn.bootstrap).not.toBeUndefined();
    expect(window.ssdn.SSDN).toEqual(SSDN);
  });

  describe("configure", () => {
    it("configures arguments", () => {
      window.ssdn.configure("collectors", ["heartbeat"]);
      window.ssdn.configure("apiKey", "test_api");

      expect(window.ssdn.args).toEqual([["collectors", ["heartbeat"]], ["apiKey", "test_api"]]);
    });
  });

  describe("bootstrap", () => {
    it("builds a ssdn instance and assigns it as the current one", () => {
      window.ssdn.configure("server", "http://initialized.test");
      window.ssdn.configure("apiKey", "API_KEY");
      window.ssdn.configure("collectors", ["video"]);
      window.ssdn.configure("user", {
        id: "test@example.com",
      });

      window.ssdn.bootstrap();
      expect(window.ssdn.current).toBeInstanceOf(SSDN);
      expect(window.ssdn.current!.client.baseUrl).toEqual("http://initialized.test");
    });
  });
});
