import ssdnEvent from "../../test-support/data-samples/caliper-ssdn-event.json";
import Event from "../interfaces/event";
import CaliperEnvelopeService from "./caliper-envelope-service";

describe("CaliperEnvelopeService", () => {
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
      const results = await CaliperEnvelopeService.process(
        ssdnEvent as Event,
        validator,
        inMemoryRepository,
      );

      expect(results).toEqual(undefined);
    });

    it("returns validation errors when it fails", async () => {
      validator.validate.mockReturnValue(false);
      validator.errors.mockReturnValue(["1st error", "2nd error"]);

      const results = await CaliperEnvelopeService.process(
        ssdnEvent as Event,
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

      const results = await CaliperEnvelopeService.process(
        ssdnEvent as Event,
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
