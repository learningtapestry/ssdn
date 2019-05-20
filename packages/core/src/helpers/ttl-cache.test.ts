import TtlCache from "./ttl-cache";

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe("TtlCache", () => {
  describe("get", () => {
    it("returns value when found", async () => {
      const cache = new TtlCache<string, number>();
      await cache.set("test", 100);
      const value = await cache.get("test");
      expect(value).toEqual(100);
    });

    it("returns null when not found", async () => {
      const cache = new TtlCache<string, number>();
      const value = await cache.get("fail");
      expect(value).toBeNull();
    });

    it("sets when not found but given a setter", async () => {
      const cache = new TtlCache<string, number>();

      let value = await cache.get("test");
      expect(value).toBeNull(); // Sanity check

      value = await cache.get("test", async () => 100);
      expect(value).toEqual(100);

      value = await cache.get("test");
      expect(value).toEqual(100);
    });

    it("expires", async () => {
      const cache = new TtlCache<string, number>(1000);
      await cache.set("test", 100);

      let value = await cache.get("test");
      expect(value).toEqual(100); // Sanity check

      await sleep(1500); // Wait a second for expiration
      value = await cache.get("test");
      expect(value).toBeNull();

      value = await cache.get("test", async () => 100);
      expect(value).toEqual(100);

      value = await cache.get("test");
      expect(value).toEqual(100);

      await sleep(1500); // Wait a second for expiration
      value = await cache.get("test");
      expect(value).toBeNull();
    });
  });

  describe("set", () => {
    it("sets a value", async () => {
      const cache = new TtlCache<string, number>();
      await cache.set("test", 100);
      const value = await cache.get("test");
      expect(value).toEqual(100);
    });

    it("sets the ttl", async () => {
      const cache = new TtlCache<string, number>(1000);
      const now = new Date().getTime();
      await cache.set("test", 100);
      const entry = cache.entries.get("test")!;
      expect(entry.expiresAt).toBeCloseTo(now + 1000);
      expect(entry.value).toEqual(100);
    });
  });
});
