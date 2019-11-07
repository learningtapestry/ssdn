import omit from "lodash/fp/omit";
import caliperJson from "../../test-support/data-samples/caliper.json";
import CaliperValidator from "./caliper-validator";

describe("CaliperValidator", () => {
  describe("validate", () => {
    it("returns a truthy response and no errors when document is valid", () => {
      const validator = new CaliperValidator();

      const result = validator.validate(caliperJson);
      const errors = validator.errors();

      expect(result).toEqual(true);
      expect(errors).toEqual([]);
    });

    it("returns a falsy response and errors when document is invalid", () => {
      const validator = new CaliperValidator();
      const invalidCaliperJson = omit(["sensor", "data"])(caliperJson);
      invalidCaliperJson.sendTime = "June 3rd 2019";
      invalidCaliperJson.dataVersion = "DATA-VERSION";

      const result = validator.validate(invalidCaliperJson);
      const errors = validator.errors();

      expect(result).toEqual(false);
      expect(errors).toEqual([
        ": should have required property 'sensor'",
        '.sendTime: should match format "date-time"',
        '.dataVersion: should match format "iri"',
        ": should have required property 'data'",
      ]);
    });
  });
});
