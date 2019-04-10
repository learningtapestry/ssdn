/**
 * factories.ts: Utility functions that create domain objects, useful for testing.
 */

export function instances() {
  return [
    {
      name: "Nucleus-Dev",
      settings: [
        {
          description: "Name of the Event Processor Kinesis Data Stream",
          key: "EventProcessorStreamName",
          value: "Nucleus-Development-EventProcessor",
        },
        {
          description: "Hello Nucleus Lambda Function ARN",
          key: "HelloNucleusFunction",
          value: `arn:aws:lambda:us-east-1:111111111111:function:
          Nucleus-Dev-HelloNucleusFunction-HCJE3P62QE5P`,
        },
      ],
    },
    {
      name: "Nucleus",
      settings: [
        {
          description: "Name of the Event Processor Kinesis Data Stream",
          key: "EventProcessorStreamName",
          value: "Nucleus-Production-EventProcessor",
        },
        {
          description: "Hello Nucleus Lambda Function ARN",
          key: "HelloNucleusFunction",
          value: `arn:aws:lambda:us-east-1:111111111111:function:
          Nucleus-HelloNucleusFunction-60K87QSYCYTJ`,
        },
      ],
    },
  ];
}
