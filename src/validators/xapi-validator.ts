/**
 * xapi-validator.ts: Validates xAPI documents against a predefined JSON Schema
 */

import Ajv from "ajv";
import map from "lodash/fp/map";
import logger from "../logger";
import xAPIFormats from "../schemas/xapi-formats.json";
import xAPISchema from "../schemas/xapi-schema.json";

class XAPIValidator implements Validator {
    public ajv: Ajv.Ajv;

    public constructor() {
        this.ajv = new Ajv({allErrors: true, formats: xAPIFormats, schemaId: "auto"});
    }

    public validate(document: object) {
        logger.debug("Validating xAPI document: %j against schema", document);

        return !!this.ajv.validate(xAPISchema, document);
    }

    public errors() {
        const printError = (error: any) => `${error.dataPath}: ${error.message}`;

        return map(printError)(this.ajv.errors);
    }
}

export default XAPIValidator;
