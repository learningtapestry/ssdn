/**
 * xapi-validator.ts: Validates xAPI documents against a predefined JSON Schema
 */

import Ajv from "ajv";
import concat from "lodash/fp/concat";
import isEmpty from "lodash/fp/isEmpty";
import map from "lodash/fp/map";
import { toArray, wrap } from "../app-helper";
import logger from "../logger";
import xAPIFormats from "../schemas/xapi-formats.json";
import xAPISchema from "../schemas/xapi-schema.json";

class XAPIValidator implements Validator {
  public ajv: Ajv.Ajv;
  private validationErrors: string[] = [];

  public constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      formats: xAPIFormats,
      schemaId: "auto",
    });
  }

  public validate(document: object | object[], rootElement: string = "") {
    toArray(document).forEach((item) => {
      logger.debug(
        "Validating xAPI document: %j against schema",
        wrap(item, rootElement),
      );

      this.ajv.validate(xAPISchema, wrap(item, rootElement));
      this.validationErrors = concat(this.validationErrors)(this.ajvErrors());
    });

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

export default XAPIValidator;
