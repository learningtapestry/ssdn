import {isBlank} from "./app-helper";

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
});
