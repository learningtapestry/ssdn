import has from "lodash/fp/has";
import KinesisRepository from "../../repositories/kinesis-repository";
import XAPIValidator from "../../validators/xapi-validator";
import EventService from "./event-service";
import LambdaEventParser from "./lambda-event-parser";

export const handler = async (event: object) => {
    const results = await EventService.process(
        new LambdaEventParser(event).parse(),
        new XAPIValidator(),
        new KinesisRepository(),
    );
    const hasErrors = has("errors")(results);

    return {statusCode: hasErrors ? 422 : 201, body: JSON.stringify(results)};
};
