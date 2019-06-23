import { KinesisStreamHandler, S3EventRecord, S3Handler } from "aws-lambda";
import parse from "csv-parse/lib/sync";
import path from "path";
import { getS3 } from "../../aws-clients";
import { DemoEvent, DemoEventType } from "../../interfaces/demo-event";
import Event from "../../interfaces/event";
import logger from "../../logger";
import { getDemoEventRepository } from "../../services";
import { parseKinesisData } from "../api-helper";

const demoEventRepository = getDemoEventRepository();

export const handler: KinesisStreamHandler | S3Handler = async (
  event: any,
  context: any,
  callback: any,
) => {
  for (const record of event.Records) {
    let demoEvent: DemoEvent;
    if (record.eventSource === "aws:s3") {
      if (path.extname(record.s3.object.key) === ".csv") {
        const csvData = await readCSV(record.s3.bucket.name, record.s3.object.key);
        demoEvent = buildCsvUploadEvent(record, csvData);
      } else {
        demoEvent = buildDirectUploadEvent(record);
      }
    } else {
      const nucleusEvent = parseKinesisData<Event>(record.kinesis.data);
      if (nucleusEvent.event.protocol === "S3" || !wantedVideoEvent(nucleusEvent)) {
        continue;
      }
      demoEvent = buildVideoEvent(nucleusEvent);
    }
    logger.info(demoEvent);

    await demoEventRepository.put(demoEvent);

    callback(null, demoEvent);
  }
};

function wantedVideoEvent(event: Event) {
  const validEvents = [
    "https://w3id.org/xapi/video/verbs/played",
    "https://w3id.org/xapi/video/verbs/paused",
  ];

  return validEvents.includes(event.content.verb.id);
}

async function readCSV(bucket: string, file: string) {
  const csvFile = await getS3()
    .getObject({
      Bucket: bucket,
      Key: file,
    })
    .promise();

  return csvFile.Body!.toString();
}

function buildVideoEvent(nucleusEvent: Event) {
  return {
    additionalInfo: {
      action: path.basename(nucleusEvent.content.verb.id),
      homepage: nucleusEvent.content.actor.account.homePage,
    },
    creationDate: nucleusEvent.event.date,
    resource: nucleusEvent.content.object.id,
    type: DemoEventType.Video,
    user: nucleusEvent.content.actor.account.name,
  };
}

function buildCsvUploadEvent(s3Event: S3EventRecord, csvData: any) {
  const data = parse(csvData);

  logger.info(data[1]);

  let event;
  if (data[0].includes("score")) {
    event = {
      additionalInfo: {
        bucket: s3Event.s3.bucket.name,
        score: data[1][4],
        scoreDate: data[1][5],
      },
      type: DemoEventType.OneRosterResults,
      user: data[1][2],
    };
  } else {
    event = {
      additionalInfo: { bucket: s3Event.s3.bucket.name, beginDate: data[1][8] },
      type: DemoEventType.OneRosterEnrollments,
      user: data[1][5],
    };
  }

  return {
    ...event,
    creationDate: s3Event.eventTime,
    resource: s3Event.s3.object.key,
  };
}

function buildDirectUploadEvent(s3Event: S3EventRecord) {
  return {
    additionalInfo: { bucket: s3Event.s3.bucket.name },
    creationDate: s3Event.eventTime,
    resource: s3Event.s3.object.key,
    type: DemoEventType.DirectFile,
    user: path
      .basename(s3Event.s3.object.key)
      .split(".")[0]
      .split("_")
      .join(" "),
  };
}
