import sinon from "sinon";
import nucleusEvent from "../../../test-support/data-samples/nucleus-event.json";
import StatementService from "./statement-service";

describe("StatementService", () => {
    describe("process", () => {
        const validator = {errors: sinon.stub().returns([]), validate: sinon.stub()};
        const inMemoryRepository = {store: sinon.stub()};

        beforeEach(() => {
            validator.validate.returns(true);
            inMemoryRepository.store.returnsArg(0);
        });

        it("stores the content when validation passes", async () => {
            const results = await StatementService.process(
                nucleusEvent, validator, inMemoryRepository,
            );

            expect(results).toEqual(["d1eec41f-1e93-4ed6-acbf-5c4bd0c24269"]);
            expect(results).not.toHaveProperty("errors");
        });

        it("returns validation errors when it fails", async () => {
            validator.validate.returns(false);
            validator.errors.returns(["1st error", "2nd error"]);

            const results = await StatementService.process(
                nucleusEvent, validator, inMemoryRepository,
            );

            expect(results).toHaveProperty("message", "The provided document is not valid");
            expect(results).toHaveProperty("errors", ["1st error", "2nd error"]);
        });

        it("wraps any uncontrolled error", async () => {
            inMemoryRepository.store.throws(new Error("Unexpected error message"));

            const results = await StatementService.process(
                nucleusEvent, validator, inMemoryRepository,
            );

            expect(results).toHaveProperty(
                "message",
                "There was an unexpected error while processing the event",
            );
            expect(results).toHaveProperty("errors", ["Unexpected error message"]);
        });
    });
});
