import "./agent";
import { Nucleus } from "./nucleus";

describe("agent", () => {
  it("sets up a global namespace", () => {
    expect(window.nucleus).not.toBeUndefined();
    expect(window.nucleus.configure).not.toBeUndefined();
    expect(window.nucleus.bootstrap).not.toBeUndefined();
    expect(window.nucleus.Nucleus).toEqual(Nucleus);
  });

  describe("configure", () => {
    it("configures arguments", () => {
      window.nucleus.configure("collectors", ["heartbeat"]);
      window.nucleus.configure("apiKey", "test_api");

      expect(window.nucleus.args).toEqual([["collectors", ["heartbeat"]], ["apiKey", "test_api"]]);
    });
  });

  describe("bootstrap", () => {
    it("builds a nucleus instance and assigns it as the current one", () => {
      window.nucleus.configure("server", "http://initialized.test");
      window.nucleus.configure("apiKey", "API_KEY");
      window.nucleus.configure("collectors", ["video"]);
      window.nucleus.configure("user", {
        id: "test@example.com",
      });

      window.nucleus.bootstrap();
      expect(window.nucleus.current).toBeInstanceOf(Nucleus);
      expect(window.nucleus.current!.client.baseUrl).toEqual("http://initialized.test");
    });
  });
});
