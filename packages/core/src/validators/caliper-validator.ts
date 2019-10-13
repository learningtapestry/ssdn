/**
 * caliper-validator.ts: Validates Caliper documents against a predefined JSON Schema
 */

import Ajv from "ajv";
import concat from "lodash/fp/concat";
import isEmpty from "lodash/fp/isEmpty";
import map from "lodash/fp/map";
import logger from "../logger";
import caliperFormats from "../schemas/caliper-formats.json";
import caliperSchema from "../schemas/caliper-schema.json";

export default class CaliperValidator implements Validator {
  public ajv: Ajv.Ajv;
  private validationErrors: string[] = [];

  public constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      formats: caliperFormats,
      schemaId: "auto",
    });
  }

  public validate(document: object, rootElement: string = "") {
    logger.debug("Validating Caliper document: %j against schema", document);

    this.ajv.validate(caliperSchema, document);
    this.validationErrors = concat(this.validationErrors)(this.ajvErrors());

    return isEmpty(this.validationErrors);
  }

  public errors() {
    return this.validationErrors;
  }

  private ajvErrors() {
    const printError = (error: any) => `${error.dataPath}: ${error.message}`;

    return map(printError)(this.ajv.errors);
  }
}
