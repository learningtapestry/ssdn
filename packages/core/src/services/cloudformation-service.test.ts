import { readEnv } from "../helpers/app-helper";
import CloudformationService from "./cloudformation-service";

jest.mock("aws-sdk/clients/cloudformation", () => {
  return class MockedCloudFormation {
    public describeStacks(params: any) {
      return {
        promise: () => {
          if (params.StackName === readEnv("NUCLEUS_STACK_ID")) {
            return Promise.resolve({ Stacks: [{ StackName: "Test" }] });
          }
          return Promise.resolve([]);
        },
      };
    }
  };
});

describe("CloudformationService", () => {
  describe("getCurrentStack", () => {
    it("returns the current stack", async () => {
      const stack = await new CloudformationService().getCurrentStack();
      expect(stack.StackName).toEqual(readEnv("NUCLEUS_STACK_ID"));
    });
  });
});
