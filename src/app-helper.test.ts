import {decode64, isBlank, readEnv, utcDate} from "./app-helper";

describe("AppHelper", () => {
    describe("isBlank", () => {
        it("rejects string when undefined or null", () => {
            expect(isBlank(undefined)).toEqual(true);
            expect(isBlank(null)).toEqual(true);
        });

        it("rejects string when empty", () => {
            expect(isBlank("")).toEqual(true);
        });

        it("accepts string when it is valid", () => {
            expect(isBlank("regular string")).toEqual(false);
        });
    });

    describe("decode64", () => {
        it("decodes base 64 string", () => {
            expect(decode64("TXkgY29udGVudA==")).toEqual("My content");
        });
    });

    describe("utcDate", () => {
        it("returns a string-based UTC date representation", () => {
            expect(utcDate(1550861675319)).toEqual("Fri, 22 Feb 2019 18:54:35 GMT");
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
});
