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
    let demoEvents: DemoEvent[];
    if (record.eventSource === "aws:s3") {
      if (path.extname(record.s3.object.key) === ".csv") {
        const csvData = await readCSV(record.s3.bucket.name, record.s3.object.key);
        demoEvents = buildCsvUploadEvent(record, csvData);
      } else {
        demoEvents = [buildDirectUploadEvent(record)];
      }
    } else {
      const ssdnEvent = parseKinesisData<Event>(record.kinesis.data);
      if (ssdnEvent.event.protocol === "S3" || !wantedVideoEvent(ssdnEvent)) {
        continue;
      }
      demoEvents = [buildVideoEvent(ssdnEvent)];
    }
    logger.info(demoEvents);

    demoEvents.forEach(async (demoEvent) => await demoEventRepository.put(demoEvent));

    callback(null, demoEvents);
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
      Key: decodeKey(file),
    })
    .promise();

  return csvFile.Body!.toString();
}

function buildVideoEvent(ssdnEvent: Event) {
  return {
    additionalInfo: {
      action: path.basename(ssdnEvent.content.verb.id),
      homepage: ssdnEvent.content.actor.account.homePage,
    },
    creationDate: ssdnEvent.event.date,
    resource: ssdnEvent.content.object.id,
    type: DemoEventType.Video,
    user: ssdnEvent.content.actor.account.name,
  };
}

function buildCsvUploadEvent(s3Event: S3EventRecord, csvData: any) {
  const data = parse(csvData);
  const headers = data[0];
  data.splice(0, 1);

  logger.info(data);

  const commonAttrs = {
    creationDate: s3Event.eventTime,
    resource: decodeKey(s3Event.s3.object.key),
  };

  const events: DemoEvent[] = [];
  data.forEach((item: any) => {
    if (headers.includes("score")) {
      events.push({
        ...commonAttrs,
        additionalInfo: {
          bucket: s3Event.s3.bucket.name,
          score: item[4],
          scoreDate: item[5],
        },
        type: DemoEventType.OneRosterResults,
        user: item[2],
      });
    } else {
      events.push({
        ...commonAttrs,
        additionalInfo: { bucket: s3Event.s3.bucket.name, beginDate: item[8] },
        type: DemoEventType.OneRosterEnrollments,
        user: item[5],
      });
    }
  });

  return events;
}

function buildDirectUploadEvent(s3Event: S3EventRecord) {
  return {
    additionalInfo: { bucket: s3Event.s3.bucket.name },
    creationDate: s3Event.eventTime,
    resource: decodeKey(s3Event.s3.object.key),
    type: DemoEventType.DirectFile,
    user: path
      .basename(decodeKey(s3Event.s3.object.key))
      .split(".")[0]
      .split("_")
      .join(" "),
  };
}

function decodeKey(key: string) {
  return decodeURIComponent(key.replace(/\+/g, "%20"));
}
