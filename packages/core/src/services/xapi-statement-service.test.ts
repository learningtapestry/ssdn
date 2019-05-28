import nucleusEvent from "../../test-support/data-samples/nucleus-event.json";
import Event from "../interfaces/event";
import XAPIStatementService from "./xapi-statement-service";

describe("XAPIStatementService", () => {
  describe("process", () => {
    const validator = {
      errors: jest.fn().mockReturnValue([]),
      validate: jest.fn(),
    };
    const inMemoryRepository = { store: jest.fn(), storeBatch: jest.fn() };

    beforeEach(() => {
      validator.validate.mockReturnValue(true);
      inMemoryRepository.store.mockImplementation((arg1: any) => arg1);
    });

    it("stores the content when validation passes", async () => {
      const results = await XAPIStatementService.process(
        nucleusEvent as Event,
        validator,
        inMemoryRepository,
      );

      expect(results).toEqual(["d1eec41f-1e93-4ed6-acbf-5c4bd0c24269"]);
      expect(results).not.toHaveProperty("errors");
    });

    it("returns validation errors when it fails", async () => {
      validator.validate.mockReturnValue(false);
      validator.errors.mockReturnValue(["1st error", "2nd error"]);

      const results = await XAPIStatementService.process(
        nucleusEvent as Event,
        validator,
        inMemoryRepository,
      );

      expect(results).toHaveProperty("message", "The provided document is not valid");
      expect(results).toHaveProperty("errors", ["1st error", "2nd error"]);
    });

    it("wraps any uncontrolled error", async () => {
      inMemoryRepository.store.mockImplementation(() => {
        throw new Error("Unexpected error message");
      });

      const results = await XAPIStatementService.process(
        nucleusEvent as Event,
        validator,
        inMemoryRepository,
      );

      expect(results).toHaveProperty(
        "message",
        "There was an unexpected error while processing the event",
      );
      expect(results).toHaveProperty("errors", ["Unexpected error message"]);
    });
  });
});
