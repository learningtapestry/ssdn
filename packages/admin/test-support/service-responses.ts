import { nullConnection, nullConnectionRequest } from "../src/app-helper";
import { ConnectionRequestStatus } from "../src/interfaces/connection-request";
import { StreamStatus } from "../src/interfaces/stream";

/**
 * service-responses.ts: Collection of objects that mock the responses of external services
 */

export function cloudFormationStacks() {
  return {
    Stacks: [
      {
        Capabilities: ["CAPABILITY_IAM"],
        ChangeSetId: `arn:aws:cloudformation:us-east-1:111111111111:changeSet/
      awscli-cloudformation-package-deploy-1553650707/2dfd29f8-1a23-4a7b-91a4-9652702d6476`,
        CreationTime: "2019-03-15T12:43:46.201Z",
        Description: "SAM Template for Nucleus",
        DisableRollback: false,
        DriftInformation: { StackDriftStatus: "NOT_CHECKED" },
        LastUpdatedTime: "2019-03-27T01:38:44.794Z",
        NotificationARNs: [],
        Outputs: [
          {
            Description: "Name of the Event Processor Kinesis Data Stream",
            OutputKey: "EventProcessorStreamName",
            OutputValue: "Nucleus-Development-EventProcessor",
          },
          {
            Description: "Hello Nucleus Lambda Function ARN",
            OutputKey: "HelloNucleusFunction",
            OutputValue: `arn:aws:lambda:us-east-1:111111111111:function:
          Nucleus-Dev-HelloNucleusFunction-HCJE3P62QE5P`,
          },
        ],
        Parameters: [
          {
            ParameterKey: "NotificationEmail",
            ParameterValue: "nucleus@example.org",
          },
          {
            ParameterKey: "Environment",
            ParameterValue: "Development",
          },
        ],
        RoleARN: "arn:aws:iam::111111111111:role/cloudformation-Nucleus-service-role",
        RollbackConfiguration: { RollbackTriggers: [] },
        StackId: `arn:aws:cloudformation:us-east-1:111111111111:stack/Nucleus-Dev/
        f928cdf0-471f-11e9-90f4-0a3a983b5e88`,
        StackName: "Nucleus-Dev",
        StackStatus: "UPDATE_COMPLETE",
        Tags: [],
      },
      {
        Capabilities: ["CAPABILITY_IAM"],
        ChangeSetId: `arn:aws:cloudformation:us-east-1:111111111111:changeSet/nucleus-change-set/
      50bb5abb-488d-4f81-9843-1b33c862bda7`,
        CreationTime: "2019-01-24T14:38:18.076Z",
        Description: "SAM Template for Nucleus",
        DisableRollback: false,
        DriftInformation: { StackDriftStatus: "NOT_CHECKED" },
        LastUpdatedTime: "2019-03-27T19:00:21.120Z",
        NotificationARNs: [],
        Outputs: [
          {
            Description: "Name of the Event Processor Kinesis Data Stream",
            OutputKey: "EventProcessorStreamName",
            OutputValue: "Nucleus-Production-EventProcessor",
          },
          {
            Description: "Hello Nucleus Lambda Function ARN",
            OutputKey: "HelloNucleusFunction",
            OutputValue:
              `arn:aws:lambda:us-east-1:111111111111:function:` +
              `Nucleus-HelloNucleusFunction-60K87QSYCYTJ`,
          },
        ],
        Parameters: [
          {
            ParameterKey: "NotificationEmail",
            ParameterValue: "deploy@learningtapestry.com",
          },
          { ParameterKey: "Environment", ParameterValue: "Production" },
        ],
        RoleARN: "arn:aws:iam::111111111111:role/cloudformation-Nucleus-service-role",
        RollbackConfiguration: { RollbackTriggers: [] },
        StackId: `arn:aws:cloudformation:us-east-1:111111111111:stack/Nucleus/
      b07ee9b0-1fe5-11e9-9c58-0a515b01a4a4`,
        StackName: "Nucleus",
        StackStatus: "UPDATE_COMPLETE",
        Tags: [],
      },
    ],
  };
}

export function cognitoUsers() {
  return {
    Users: [
      {
        Attributes: [
          {
            Name: "sub",
            Value: "6fa6a456-7f89-45df-81f0-cc20a78a7d30",
          },
          {
            Name: "email_verified",
            Value: "true",
          },
          {
            Name: "phone_number_verified",
            Value: "false",
          },
          {
            Name: "phone_number",
            Value: "+1555555555",
          },
          {
            Name: "name",
            Value: "Test User 1",
          },
          {
            Name: "email",
            Value: "test-user-1@example.org",
          },
        ],
        Enabled: true,
        UserCreateDate: "2019-04-05T18:50:49.916Z",
        UserLastModifiedDate: "2019-04-05T18:56:48.527Z",
        UserStatus: "CONFIRMED",
        Username: "test-user-1",
      },
      {
        Attributes: [
          {
            Name: "sub",
            Value: "79065bb3-d5d3-4ba8-97d3-e4a2d0c6a872",
          },
          {
            Name: "email_verified",
            Value: "true",
          },
          {
            Name: "phone_number_verified",
            Value: "false",
          },
          {
            Name: "phone_number",
            Value: "+1666666666",
          },
          {
            Name: "name",
            Value: "Test User 2",
          },
          {
            Name: "email",
            Value: "test-user-2@example.org",
          },
        ],
        Enabled: true,
        UserCreateDate: "2019-04-08T17:26:53.321Z",
        UserLastModifiedDate: "2019-04-08T17:26:53.321Z",
        UserStatus: "FORCE_CHANGE_PASSWORD",
        Username: "test-user-2",
      },
    ],
  };
}

export const connectionRequestAdam = nullConnectionRequest({
  acceptanceToken: "AcceptanceTokenAdam",
  channels: ["S3"],
  connection: {
    awsAccountId: "AwsAccountIdAdam",
    externalId: "ExternalIdAdam",
    nucleusId: "NucleusIdAdam",
  },
  consumerEndpoint: "https://nucleus.adam.acme.org/",
  creationDate: "2019-02-13T12:21:36.120Z",
  id: "ConnReqIdAdam",
  organization: "Stoltenberg-Harvey",
  providerEndpoint: "https://nucleus.ajax.org",
  status: ConnectionRequestStatus.Accepted,
  verificationCode: "VerifyAdam",
});

export const connectionAdam = nullConnection({
  endpoint: "https://nucleus.adam.acme.org/",
  inputStreams: [{ channel: "XAPI", namespace: "nucleus.ajax.org", status: StreamStatus.Active }],
  outputStreams: [
    { channel: "XAPI", namespace: "nucleus.adam.acme.org", status: StreamStatus.Active },
  ],
});

export const connectionRequestJonah = nullConnectionRequest({
  acceptanceToken: "AcceptanceTokenJonah",
  channels: ["XAPI"],
  connection: {
    awsAccountId: "AwsAccountIdJonah",
    externalId: "ExternalIdJonah",
    nucleusId: "NucleusIdJonah",
  },
  consumerEndpoint: "https://nucleus.jonah.acme.org/",
  creationDate: "2019-04-14T15:31:55.120Z",
  id: "ConnReqIdJonah",
  organization: "Disney",
  providerEndpoint: "https://nucleus.ajax.org",
  status: ConnectionRequestStatus.Created,
  verificationCode: "VerifyJonah",
});

export const connectionJonah = nullConnection({
  endpoint: "https://nucleus.jonah.acme.org/",
  inputStreams: [{ channel: "XAPI", namespace: "nucleus.ajax.org", status: StreamStatus.Paused }],
  outputStreams: [
    { channel: "XAPI", namespace: "nucleus.jonah.acme.org", status: StreamStatus.Paused },
  ],
});

export const connectionRequestMickey = nullConnectionRequest({
  acceptanceToken: "AcceptanceTokenMickey",
  channels: ["XAPI", "S3"],
  connection: {
    awsAccountId: "AwsAccountIdMickey",
    externalId: "ExternalIdMickey",
    nucleusId: "NucleusIdMickey",
  },
  consumerEndpoint: "https://nucleus.mickey.acme.org/",
  creationDate: "2019-04-14T11:31:55.120Z",
  id: "ConnReqIdMickey",
  organization: "Heaney, Hackett and Jacobson",
  providerEndpoint: "https://nucleus.ajax.org",
  status: ConnectionRequestStatus.Rejected,
  verificationCode: "VerifyMickey",
});

export const connectionMickey = nullConnection({
  endpoint: "https://nucleus.mickey.acme.org/",
  inputStreams: [
    { channel: "XAPI", namespace: "nucleus.ajax.org", status: StreamStatus.PausedExternal },
  ],
  outputStreams: [
    { channel: "XAPI", namespace: "nucleus.mickey.acme.org", status: StreamStatus.PausedExternal },
  ],
});

export function connectionRequestItems() {
  return {
    Items: [connectionRequestAdam, connectionRequestJonah, connectionRequestMickey],
  };
}

export function connections() {
  return {
    Items: [connectionAdam, connectionJonah, connectionMickey],
  };
}

export function logGroups() {
  return {
    logGroups: [
      {
        arn:
          `arn:aws:logs:us-east-1:111111111111:log-group:/aws/lambda/Nucleus-` +
          `AuthorizeBeaconFunction-1P2GO4YF9VZA7:*`,
        creationTime: 1555202318486,
        logGroupName: "/aws/lambda/Nucleus-AuthorizeBeaconFunction-1P2GO4YF9VZA7",
        metricFilterCount: 0,
        storedBytes: 0,
      },
      {
        arn:
          `arn:aws:logs:us-east-1:111111111111:log-group:/aws/lambda/Nucleus-` +
          `ProcessXAPIStatementFunction-HCJE3P62QE5P:*`,
        creationTime: 1553517132468,
        logGroupName: "/aws/lambda/Nucleus-ProcessXAPIStatementFunction-HCJE3P62QE5P",
        metricFilterCount: 0,
        storedBytes: 0,
      },
    ],
  };
}

export function logStreams() {
  return {
    logStreams: [
      {
        arn:
          `arn:aws:logs:us-east-1:264441468378:log-group:/aws/lambda/Nucleus-Dev-` +
          `AuthorizeBeaconFunction-1P2GO4YF9VZA7:log-stream:2019/04/14/[$LATEST]` +
          `b9dbeb8808d54f398aed8a654c9ddf5c`,
        creationTime: 1555255087383,
        firstEventTimestamp: 1555255315091,
        lastEventTimestamp: 1555255316099,
        lastIngestionTime: 1555255316129,
        logStreamName: "2019/04/14/[$LATEST]b9dbeb8808d54f398aed8a654c9ddf5c",
        storedBytes: 0,
        uploadSequenceToken: "49590950333862645815504765286593577355146551043222039426",
      },
      {
        arn:
          `arn:aws:logs:us-east-1:264441468378:log-group:/aws/lambda/Nucleus-Dev-` +
          `AuthorizeBeaconFunction-1P2GO4YF9VZA7:log-stream:2019/04/14/[$LATEST]` +
          `10b6496f1bfc4428b05f51dfca0e40d4`,
        creationTime: 1555254475694,
        firstEventTimestamp: 1555254475840,
        lastEventTimestamp: 1555255015115,
        lastIngestionTime: 1555255015130,
        logStreamName: "2019/04/14/[$LATEST]10b6496f1bfc4428b05f51dfca0e40d4",
        storedBytes: 0,
        uploadSequenceToken: "49593604370324850860525249697821557314164072887760345074",
      },
    ],
  };
}
export function logEvents() {
  return {
    events: [
      {
        ingestionTime: 1555255315279,
        message: "START RequestId: df528d1a-6049-4430-8835-38e7ef58b800 Version: $LATEST\n",
        timestamp: 1555255315091,
      },
      {
        ingestionTime: 1555255316129,
        message: "END RequestId: df528d1a-6049-4430-8835-38e7ef58b800\n",
        timestamp: 1555255316099,
      },
    ],
  };
}
