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
