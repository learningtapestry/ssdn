import { CodePipelineHandler } from "aws-lambda";
import CloudWatchLogs from "aws-sdk/clients/cloudwatchlogs";
import S3 from "aws-sdk/clients/s3";

import { getCloudWatchLogs, getCodePipeline, getIam, getS3 } from "../../aws-clients";
import { BUCKETS, POLICIES } from "../../interfaces/aws-metadata-keys";
import logger from "../../logger";
import { getMetadataService } from "../../services";

export const handler: CodePipelineHandler = async (event, context) => {
  if ((event as any).REALLY_DELETE_STACK_DEPENDENCIES) {
    // The function was invoked directly.
    logger.info("Running clean up for direct invocation.");
    await cleanUp({ deleteLogs: (event as any).DELETE_LOGS });
    return;
  }

  const codePipeline = getCodePipeline();

  try {
    const userParameters = JSON.parse(
      event["CodePipeline.job"].data.actionConfiguration.configuration.UserParameters,
    );

    if (userParameters.REALLY_DELETE_STACK_DEPENDENCIES) {
      await cleanUp({ deleteLogs: userParameters.DELETE_LOGS, wait: userParameters.WAIT });
    } else {
      logger.info(
        "In order to clean up dependencies, set the " +
          "REALLY_DELETE_STACK_DEPENDENCIES key in the event.",
      );
    }

    await codePipeline
      .putJobSuccessResult({
        jobId: event["CodePipeline.job"].id,
      })
      .promise();
  } catch (e) {
    const errorMessage = e && e.message ? e.message : "Unexpected error";
    logger.error(`Error: ${errorMessage}`);

    await codePipeline
      .putJobFailureResult({
        failureDetails: {
          message: errorMessage,
          type: "JobFailed",
        },
        jobId: event["CodePipeline.job"].id,
      })
      .promise();
  }
};

async function cleanUp(options: { deleteLogs?: boolean; wait?: number }) {
  if (options.wait) {
    logger.info(`Waiting for ${options.wait}ms.`);
    await delay(options.wait);
  }

  logger.info("Cleaning up stack dependencies.");
  logger.info("Deleting IAM roles.");
  await cleanUpIam();
  logger.info("Emptying S3 buckets.");
  await cleanUpS3();

  if (options.deleteLogs) {
    logger.info("Deleting log groups.");
    await cleanUpCloudWatch();
  }
}

async function cleanUpCloudWatch() {
  const client = getCloudWatchLogs();

  for await (const group of getLogGroups(client)) {
    try {
      await client
        .deleteLogGroup({
          logGroupName: group.logGroupName!,
        })
        .promise();
    } catch (e) {
      logger.error(`Problem deleting log group ${group.logGroupName}: ${e.message}`);
    }
  }
}

async function cleanUpIam() {
  const metadata = getMetadataService();
  const iam = getIam();

  for (const policy of [POLICIES.consumerPolicy, POLICIES.providerPolicy]) {
    logger.info(`Cleaning up policy ${policy}.`);
    const policyArn = (await metadata.getMetadataValue(policy)).value;
    const attachedRoles = await iam
      .listEntitiesForPolicy({
        EntityFilter: "Role",
        PolicyArn: policyArn,
      })
      .promise();
    for (const role of attachedRoles.PolicyRoles!) {
      await iam
        .detachRolePolicy({
          PolicyArn: policyArn,
          RoleName: role.RoleName!,
        })
        .promise();
      if (role.RoleName!.startsWith("ssdn_ex")) {
        await iam.deleteRole({
          RoleName: role.RoleName!,
        });
      }
    }
  }
}

async function cleanUpS3() {
  const metadata = getMetadataService();
  const s3 = getS3();

  for (const bucket of [BUCKETS.delivery, BUCKETS.download, BUCKETS.upload]) {
    logger.info(`Cleaning up bucket ${bucket}.`);
    const bucketArn = (await metadata.getMetadataValue(bucket)).value;
    let isVersioned = false;
    try {
      const response = await s3
        .getBucketVersioning({
          Bucket: bucketArn,
        })
        .promise();
      if (response.Status === "Enabled") {
        isVersioned = true;
      }
    } catch {}
    if (isVersioned) {
      for await (const versions of getVersionBatches(s3, bucketArn)) {
        await s3
          .deleteObjects({
            Bucket: bucketArn,
            Delete: {
              Objects: versions.map((v) => ({ Key: v.Key!, VersionId: v.VersionId })),
            },
          })
          .promise();
      }
    } else {
      for await (const objects of getObjectBatches(s3, bucketArn)) {
        await s3
          .deleteObjects({
            Bucket: bucketArn,
            Delete: {
              Objects: objects.map((v) => ({ Key: v.Key! })),
            },
          })
          .promise();
      }
    }
  }
}

async function* getLogGroups(cw: CloudWatchLogs) {
  let nextToken;

  while (true) {
    const groups: CloudWatchLogs.DescribeLogGroupsResponse = await cw
      .describeLogGroups({
        logGroupNamePrefix: `/aws/lambda/${process.env.SSDN_STACK_NAME}`,
        nextToken,
      })
      .promise();

    if (!groups.logGroups) {
      break;
    }

    if (!groups.logGroups.length) {
      break;
    }

    yield* groups.logGroups;

    if (!groups.nextToken) {
      break;
    }

    nextToken = groups.nextToken;
  }
}

async function* getVersionBatches(s3: S3, bucket: string) {
  let nextKeyToken;
  let nextVersionToken;

  while (true) {
    const versions: S3.ListObjectVersionsOutput = await s3
      .listObjectVersions({
        Bucket: bucket,
        KeyMarker: nextKeyToken,
        MaxKeys: 1000,
        VersionIdMarker: nextVersionToken,
      })
      .promise();

    if (!versions.Versions) {
      break;
    }

    if (versions.Versions.length === 0) {
      break;
    }

    yield versions.Versions;

    if (!versions.NextKeyMarker && !versions.NextVersionIdMarker) {
      break;
    }

    nextKeyToken = versions.NextKeyMarker;
    nextVersionToken = versions.NextVersionIdMarker;
  }
}

async function* getObjectBatches(s3: S3, bucket: string) {
  let nextKeyToken;

  while (true) {
    const objects: S3.ListObjectsOutput = await s3
      .listObjects({
        Bucket: bucket,
        Marker: nextKeyToken,
        MaxKeys: 1000,
      })
      .promise();

    if (!objects.Contents) {
      break;
    }

    if (objects.Contents.length === 0) {
      break;
    }

    yield objects.Contents;

    if (!objects.NextMarker) {
      break;
    }

    nextKeyToken = objects.NextMarker;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
