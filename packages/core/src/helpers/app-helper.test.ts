import { calculateIdentifier, decode64, isoDate, readEnv, toArray, wrap } from "./app-helper";

describe("AppHelper", () => {
  describe("decode64", () => {
    it("decodes base 64 string", () => {
      expect(decode64("TXkgY29udGVudA==")).toEqual("My content");
    });
  });

  describe("utcDate", () => {
    it("returns a string-based UTC date representation", () => {
      expect(isoDate(1550861675319)).toEqual("2019-02-22T18:54:35.319Z");
    });
  });

  describe("readEnv", () => {
    it("returns the value when variable is defined", () => {
      process.env.TEST_VAR = "content";

      expect(readEnv("TEST_VAR")).toEqual("content");
    });

    it("throws an error when variable has not been defined", () => {
      expect(() => {
        readEnv("UNDEFINED_VAR");
      }).toThrow("Variable 'UNDEFINED_VAR' has not been initialized");
    });

    it("throws an error when variable is blank", () => {
      process.env.TEST_VAR = "";

      expect(() => {
        readEnv("TEST_VAR");
      }).toThrow("Variable 'TEST_VAR' has not been initialized");
    });

    it("returns the default value when set", () => {
      expect(readEnv("UNDEFINED_VAR", "value")).toEqual("value");
      expect(readEnv("UNDEFINED_VAR", "")).toEqual("");
    });
  });

  describe("calculateIdentifier", () => {
    it("returns a new UUID if object has no id", () => {
      const content = { foo: "bar" };
      const uuidRegex = /^[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$/;

      expect(calculateIdentifier(content)).toMatch(uuidRegex);
    });

    it("preserves the id when already set", () => {
      const content = {
        foo: "bar",
        id: "c731c327-fc08-49e9-8494-4e78a9b3b5f5",
      };

      expect(calculateIdentifier(content)).toEqual("c731c327-fc08-49e9-8494-4e78a9b3b5f5");
    });
  });

  describe("toArray", () => {
    it("returns a new array when argument is an object", () => {
      expect(toArray({ a: 1 })).toEqual([{ a: 1 }]);
    });

    it("returns the same when argument is an array", () => {
      expect(toArray([{ a: 1 }, { b: 2 }])).toEqual([{ a: 1 }, { b: 2 }]);
    });
  });

  describe("wrap", () => {
    it("wraps the object inside a root element", () => {
      expect(wrap({ a: 1 }, "topLevel")).toEqual({ topLevel: { a: 1 } });
    });

    it("ignores the wrapping when root is not set", () => {
      expect(wrap({ a: 1 })).toEqual({ a: 1 });
    });
  });
});
