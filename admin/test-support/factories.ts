/**
 * factories.ts: Utility functions that create domain objects, useful for testing.
 */

import * as responses from "./service-responses";

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

export function users() {
  return [
    {
      creationDate: new Date("2019-04-05T18:50:49.916Z"),
      email: "test-user-1@example.org",
      fullName: "Test User 1",
      phoneNumber: "+1555555555",
      status: "CONFIRMED",
      username: "test-user-1",
    },
    {
      creationDate: new Date("2019-04-08T17:26:53.321Z"),
      email: "test-user-2@example.org",
      fullName: "Test User 2",
      phoneNumber: "+1666666666",
      status: "FORCE_CHANGE_PASSWORD",
      username: "test-user-2",
    },
  ];
}

export function connectionRequests() {
  return responses.connectionRequestItems().Items;
}
