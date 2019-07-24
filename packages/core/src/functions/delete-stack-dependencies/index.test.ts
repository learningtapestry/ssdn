jest.mock("../../aws-clients");
jest.mock("../../services");
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import CloudWatchLogs from "aws-sdk/clients/cloudwatchlogs";
import CodePipeline from "aws-sdk/clients/codepipeline";
import IAM from "aws-sdk/clients/iam";
import S3 from "aws-sdk/clients/s3";

import { fakeAws, fakeImpl, mocked } from "../../../test-support/jest-helper";
import { getCloudWatchLogs, getCodePipeline, getIam, getS3 } from "../../aws-clients";
import { BUCKETS, POLICIES } from "../../interfaces/aws-metadata-keys";
import { getMetadataService } from "../../services";
import AwsSSDNMetadataService from "../../services/aws-ssdn-metadata-service";
import { handler } from "./";

const fakeMetadata = fakeImpl<AwsSSDNMetadataService>({
  getMetadataValue: jest.fn((key) => ({
    value: ({
      [POLICIES.consumerPolicy]: "TestConsumerPolicy",
      [POLICIES.providerPolicy]: "TestProviderPolicy",
      [BUCKETS.delivery]: "TestDelivery",
      [BUCKETS.download]: "TestDownload",
      [BUCKETS.upload]: "TestUpload",
    } as any)[key],
  })),
});

const fakeCloudWatchLogs = fakeAws<CloudWatchLogs>({});
const fakeCodePipeline = fakeAws<CodePipeline>({
  putJobFailureResult: jest.fn(),
  putJobSuccessResult: jest.fn(),
});
const fakeIam = fakeAws<IAM>({});
const fakeS3 = fakeAws<S3>({});

mocked(getMetadataService).mockReturnValue(fakeMetadata);
mocked(getCloudWatchLogs).mockReturnValue(fakeCloudWatchLogs);
mocked(getCodePipeline).mockReturnValue(fakeCodePipeline);
mocked(getIam).mockReturnValue(fakeIam);
mocked(getS3).mockReturnValue(fakeS3);

describe("DeleteStackDependenciesFunction", () => {
  it("short circuits when there's no REALLY_DELETE_STACK_DEPENDENCIES parameter", async () => {
    const event = {
      "CodePipeline.job": {
        data: { actionConfiguration: { configuration: { UserParameters: JSON.stringify({}) } } },
        id: "testid",
      },
    };

    await handler((event as unknown) as any, {} as Context, () => {});

    expect(fakeCodePipeline.impl.putJobSuccessResult).toHaveBeenCalledWith({ jobId: "testid" });
  });
});
