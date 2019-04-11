import { CloudFormation, CognitoIdentityServiceProvider } from "aws-sdk";
import AWS from "aws-sdk-mock";
import * as factories from "../../test-support/factories";
import * as responses from "../../test-support/service-responses";
import AWSService from "./aws-service";

describe(AWSService, () => {
  afterEach(() => {
    AWS.restore();
  });

  describe("availableStacks", () => {
    it("retrieves the available stacks and return instances", async () => {
      AWS.mock("CloudFormation", "describeStacks", responses.cloudFormationStacks());

      const availableStacks = await AWSService.availableStacks({
        cloudFormation: new CloudFormation(),
      });

      expect(availableStacks).toEqual(factories.instances());
    });
  });

  describe("retrieveUsers", () => {
    it("retrieves the current users in the pool", async () => {
      AWS.mock("CognitoIdentityServiceProvider", "listUsers", responses.cognitoUsers());

      const users = await AWSService.retrieveUsers({
        cognitoIdentityServiceProvider: new CognitoIdentityServiceProvider(),
      });

      expect(users).toEqual(factories.users());
    });
  });
});
