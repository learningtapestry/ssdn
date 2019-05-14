import IAM from "aws-sdk/clients/iam";

import { fakeAws, fakeImpl } from "../../test-support/jest-helper";
import IamService from "./iam-service";
import NucleusMetadataService from "./nucleus-metadata-service";

const fakeIam = fakeAws<IAM>({
  attachRolePolicy: jest.fn(() => Promise.resolve()),
  createRole: jest.fn(({ RoleName }) =>
    Promise.resolve({
      Role: {
        Arn: `${RoleName}Arn`,
      },
    }),
  ),
  getRole: jest.fn(({ RoleName }) =>
    RoleName === "nucleus_ex_654321_nucleustest_externaltest"
      ? Promise.resolve({
          Role: {
            Arn: `${RoleName}Arn`,
            AssumeRolePolicyDocument: encodeURIComponent(
              JSON.stringify({
                Statement: [
                  {
                    Action: "sts:AssumeRole",
                    Condition: { StringEquals: { "sts:ExternalId": "123456" } },
                    Effect: "Allow",
                    Principal: { AWS: "Example Corp's AWS Account ID" },
                  },
                ],
                Version: "2012-10-17",
              }),
            ),
          },
        })
      : Promise.reject(),
  ),
});

describe("IamService", () => {
  describe("attachEndpointRolePolicy", () => {
    it("attaches a role to a policy", async () => {
      const iamService = new IamService(fakeIam);
      await iamService.attachEndpointRolePolicy(
        { value: "TestPolicyArn" },
        { value: "https://nucleustest.learningtapestry.com" },
        "https://externaltest.learningtapestry.com",
        "123456",
      );
      expect(fakeIam.impl.attachRolePolicy!.mock.calls[0][0]).toEqual({
        PolicyArn: "TestPolicyArn",
        RoleName: "nucleus_ex_123456_nucleustest_externaltest",
      });
    });
  });

  describe("findOrCreateEndpointRole", () => {
    it("finds a role when one already exists", async () => {
      const iamService = new IamService(fakeIam);
      const result = await iamService.findOrCreateEndpointRole(
        { value: "https://nucleustest.learningtapestry.com" },
        "https://externaltest.learningtapestry.com",
        "654321",
      );
      expect(result).toEqual({
        arn: "nucleus_ex_654321_nucleustest_externaltestArn",
        externalId: "123456",
      });
    });

    it("creates a role when none exists", async () => {
      const iamService = new IamService(fakeIam);
      const result = await iamService.findOrCreateEndpointRole(
        { value: "https://nucleustest.learningtapestry.com" },
        "https://newrole.learningtapestry.com",
        "654321",
      );
      expect(result.arn).toEqual("nucleus_ex_654321_nucleustest_newroleArn");
      expect(result.externalId).toBeTruthy();
      expect(result.externalId.split("-")).toHaveLength(5); // It's an UUID v4
    });
  });
});
