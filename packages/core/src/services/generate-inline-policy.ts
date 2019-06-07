import { Connection, PublicNucleusMetadata } from "../interfaces/connection";
import { StreamStatus } from "../interfaces/stream";
import logger from "../logger";

export default class GenerateInlinePolicy {
  public static generate(metadata: PublicNucleusMetadata, connection: Connection) {
    const statements = [];

    if (connection.isConsumer) {
      statements.push({
        Action: ["s3:listBucket"],
        Effect: "Allow",
        Resource: [`arn:aws:s3:::${metadata.UploadS3Bucket}`],
      });

      for (const outputStream of connection.outputStreams) {
        if (outputStream.status !== StreamStatus.Active) {
          continue;
        }

        statements.push({
          Action: ["s3:GetObject"],
          Effect: "Allow",
          Resource: [
            `arn:aws:s3:::${metadata.UploadS3Bucket}/${outputStream.namespace}/${
              outputStream.format
            }/*`,
          ],
        });
      }
    }

    return {
      Statement: statements,
      Version: "2012-10-17",
    };
  }
}
