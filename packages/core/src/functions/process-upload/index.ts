import { S3Handler } from "aws-lambda";
import filter from "lodash/fp/filter";
import isEmpty from "lodash/fp/isEmpty";
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
  isEmpty(errors) ? callback(null, results as any) : callback(errors as any);
};
