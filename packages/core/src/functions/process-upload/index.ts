import { S3Handler } from "aws-lambda";
import filter from "lodash/fp/filter";
import isEmpty from "lodash/fp/isEmpty";
import { AWS_NUCLEUS } from "../../interfaces/aws-metadata-keys";
import S3EventParser from "../../parsers/s3-event-parser";
import { getEventRepository, getMetadataService } from "../../services";
import FileUploadService from "../../services/file-upload-service";

export const handler: S3Handler = async (event, context, callback) => {
  const namespace = await getMetadataService().getMetadataValue(AWS_NUCLEUS.namespace);
  const results = await Promise.all(
    event.Records.map(async (record) => {
      return await FileUploadService.process(
        new S3EventParser(record, namespace.value).parse(),
        getEventRepository(),
      );
    }),
  );

  const errors = filter("error")(results);
  isEmpty(errors) ? callback(null, results as any) : callback(errors as any);
};
