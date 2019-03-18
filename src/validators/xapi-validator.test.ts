import omit from "lodash/fp/omit";
import xAPIJson from "../../test-support/data-samples/xapi.json";
import XAPIValidator from "./xapi-validator";

describe("XAPIValidator", () => {
    describe("validate", () => {
        it("returns a truthy response and no errors when document is valid", () => {
            const validator = new XAPIValidator();

            const result = validator.validate(xAPIJson);
            const errors = validator.errors();

            expect(result).toEqual(true);
            expect(errors).toEqual([]);
        });

        it("returns a falsy response and errors when document is invalid", () => {
            const validator = new XAPIValidator();
            const invalidXAPIJson = omit(["statement_base.verb"])(xAPIJson);
            invalidXAPIJson.about.version = "INVALID";

            const result = validator.validate(invalidXAPIJson);
            const errors = validator.errors();

            expect(result).toEqual(false);
            expect(errors).toEqual([
                ".about.version: should match format \"version\"",
                ".statement_base: should have required property 'verb'",
            ]);
        });

        it("validates an array of documents returning the combined errors", () => {
            const validator = new XAPIValidator();
            const documents = [omit(["statement_base.verb"])(xAPIJson),
                omit("statement_base.actor")(xAPIJson)];

            const result = validator.validate(documents);
            const errors = validator.errors();

            expect(result).toEqual(false);
            expect(errors).toEqual([
                ".statement_base: should have required property 'verb'",
                ".statement_base: should have required property 'actor'",
            ]);
        });
    });
});
