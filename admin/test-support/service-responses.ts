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
            OutputValue: `arn:aws:lambda:us-east-1:111111111111:function:
          Nucleus-HelloNucleusFunction-60K87QSYCYTJ`,
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
