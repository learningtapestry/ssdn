import {decode64, isBlank, utcDate} from "./app-helper";

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
});
