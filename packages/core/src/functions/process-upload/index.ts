import { S3Handler } from "aws-lambda";
import filter from "lodash/fp/filter";
import isEmpty from "lodash/fp/isEmpty";

import logger from "../../logger";
import S3EventParser from "../../parsers/s3-event-parser";
import { getEventRepository } from "../../services";
import FileUploadService from "../../services/file-upload-service";

export const handler: S3Handler = async (event, context, callback) => {
  const results = await Promise.all(
    event.Records.map(async (record) => {
      return await FileUploadService.process(
        new S3EventParser(record).parse(),
        getEventRepository(),
      );
    }),
  );

  const errors = filter("error")(results);

  if (isEmpty(errors)) {
    logger.info(`Completed processing for ${event.Records.length} records without errors.`);
    callback(null, results as any);
  } else {
    logger.error(`Found ${errors.length} errors.`);
    callback(errors as any);
  }
};
